import "server-only";

import { getMerchFlags } from "@/lib/merch/config";
import {
  assertOrderTransition,
  canTransitionOrder,
} from "@/lib/merch/order-state-machine";
import type { MerchOrderStatus } from "@/lib/merch/types";
import { getPrintfulConfig } from "@/lib/printful/config";
import { getPrintfulClientOrNull } from "@/lib/printful/client";
import { submitOrder } from "@/lib/printful/orders";
import type { PrintfulOrderItemInput, PrintfulRecipient } from "@/lib/printful/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Printful order submission for a PAID merch order (ADR-024, spec §20).
 *
 * Idempotent on every layer: submitOrder() looks the order up by external id
 * (the BuyMeATee public reference) before creating one, the DB has a unique
 * printful_order_id, and the order status guards the transition. A repeated
 * Stripe webhook can never create a second Printful order. Runs only when
 * PRINTFUL_ORDER_SUBMISSION_ENABLED is on; otherwise the order waits for a
 * manual submission from the admin (spec §38).
 *
 * On failure after payment the order is flagged for attention and NOT auto-
 * refunded (a transient error must not lose the order); creator earnings are
 * never transferred until fulfilment progresses (lib/merch/transfers.ts).
 */

export type FulfilmentOutcome =
  | { status: "submitted"; orderId: string; printfulOrderId: string; alreadyExisted: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; orderId: string; error: string };

interface FulfilmentOrderRow {
  id: string;
  public_reference: string;
  status: MerchOrderStatus;
  shipping_address_snapshot: PrintfulRecipient | null;
  buyer_email: string | null;
}

interface FulfilmentItemRow {
  quantity: number;
  unit_price_minor: number;
  printful_catalog_variant_id: number | null;
  colour: string | null;
  size: string | null;
}

const ARTWORK_BUCKET = "covers"; // MVP: artwork reuses the covers bucket (§7).

export async function submitPaidOrderToPrintful(
  orderId: string,
  options: { force?: boolean } = {},
): Promise<FulfilmentOutcome> {
  const flags = getMerchFlags();
  if (!options.force && !flags.printfulOrderSubmissionEnabled) {
    return { status: "skipped", reason: "submission-disabled" };
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("merch_orders")
    .select("id, public_reference, status, shipping_address_snapshot, buyer_email")
    .eq("id", orderId)
    .maybeSingle();
  const order = data as FulfilmentOrderRow | null;
  if (!order) {
    return { status: "skipped", reason: "order-not-found" };
  }
  if (order.status === "paid") {
    // Move into the submission-pending state (guarded).
    if (!canTransitionOrder("paid", "printful_submission_pending")) {
      return { status: "skipped", reason: "invalid-state" };
    }
  } else if (order.status !== "printful_submission_pending") {
    return { status: "skipped", reason: `not-submittable-from-${order.status}` };
  }

  const recipient = order.shipping_address_snapshot;
  if (!recipient) {
    return { status: "failed", orderId: order.id, error: "missing shipping address" };
  }

  const printful = getPrintfulClientOrNull();
  if (!printful) {
    return { status: "skipped", reason: "fulfilment-unavailable" };
  }

  // Load line items + the artwork the creator's products use.
  const { data: itemsData } = await supabase
    .from("merch_order_items")
    .select("quantity, unit_price_minor, printful_catalog_variant_id, colour, size, creator_product_id")
    .eq("order_id", order.id);
  const items = (itemsData as (FulfilmentItemRow & { creator_product_id: string | null })[]) ?? [];
  if (items.length === 0) {
    return { status: "failed", orderId: order.id, error: "no order items" };
  }

  const artworkUrl = await resolveArtworkUrl(items[0].creator_product_id);
  if (!artworkUrl) {
    return { status: "failed", orderId: order.id, error: "missing artwork url" };
  }

  const printfulItems: PrintfulOrderItemInput[] = items
    .filter((i) => i.printful_catalog_variant_id !== null)
    .map((i) => ({
      variantId: i.printful_catalog_variant_id as number,
      quantity: i.quantity,
      retailPrice: (i.unit_price_minor / 100).toFixed(2),
      files: [{ url: artworkUrl }],
    }));

  // Advance to submission-pending before the call so a crash mid-submit is
  // visible; the idempotent submitOrder() makes a retry safe.
  if (order.status === "paid") {
    assertOrderTransition("paid", "printful_submission_pending");
    await supabase
      .from("merch_orders")
      .update({
        status: "printful_submission_pending" satisfies MerchOrderStatus,
        submitted_to_printful_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("status", "paid");
  }

  try {
    const mode = getPrintfulConfig().orderMode;
    const { order: printfulOrder, alreadyExisted } = await submitOrder(printful, {
      externalId: order.public_reference,
      recipient,
      items: printfulItems,
      mode,
    });

    const nextStatus: MerchOrderStatus =
      printfulOrder.status === "confirmed" || mode === "auto"
        ? "printful_confirmed"
        : "printful_draft_created";

    await supabase
      .from("merch_orders")
      .update({
        printful_order_id: String(printfulOrder.id),
        printful_external_order_id: order.public_reference,
        printful_status: printfulOrder.status,
        printful_response_snapshot: printfulOrder,
        fulfilment_status: nextStatus === "printful_confirmed" ? "confirmed" : "submitted",
        status: nextStatus,
        accepted_by_printful_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    await supabase.from("merch_order_events").insert({
      order_id: order.id,
      event_type: alreadyExisted ? "printful_order_existing" : "printful_order_created",
      source: "printful",
      new_status: nextStatus,
      external_event_id: `pf-order-${printfulOrder.id}`,
      message: `Printful order ${printfulOrder.id} (${printfulOrder.status}).`,
    });

    return {
      status: "submitted",
      orderId: order.id,
      printfulOrderId: String(printfulOrder.id),
      alreadyExisted,
    };
  } catch (error) {
    // Flag for attention; do NOT auto-refund on a first transient error (§20).
    await supabase
      .from("merch_orders")
      .update({
        status: "on_hold" satisfies MerchOrderStatus,
        reconciliation_error: `printful submission failed: ${(error as Error).message}`,
      })
      .eq("id", order.id)
      .eq("status", "printful_submission_pending");
    await supabase.from("merch_order_events").insert({
      order_id: order.id,
      event_type: "printful_submission_failed",
      source: "printful",
      message: (error as Error).message,
    });
    return { status: "failed", orderId: order.id, error: (error as Error).message };
  }
}

/** Resolve a public artwork URL for a product (Printful pulls it by URL, §7). */
async function resolveArtworkUrl(
  creatorProductId: string | null,
): Promise<string | null> {
  if (!creatorProductId) {
    return null;
  }
  const supabase = getSupabaseAdminClient();
  const { data: product } = await supabase
    .from("merch_products")
    .select("artwork_file_id")
    .eq("id", creatorProductId)
    .maybeSingle();
  const artworkFileId = (product as { artwork_file_id: string | null } | null)?.artwork_file_id;
  if (!artworkFileId) {
    return null;
  }
  const { data: file } = await supabase
    .from("merch_artwork_files")
    .select("storage_path")
    .eq("id", artworkFileId)
    .maybeSingle();
  const path = (file as { storage_path: string } | null)?.storage_path;
  if (!path) {
    return null;
  }
  return supabase.storage.from(ARTWORK_BUCKET).getPublicUrl(path).data.publicUrl;
}
