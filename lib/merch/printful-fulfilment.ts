import "server-only";

import { sendMerchOrderShipped } from "@/lib/email/merch-notify";
import {
  assertOrderTransition,
  canTransitionOrder,
} from "@/lib/merch/order-state-machine";
import { executeCreatorTransfer } from "@/lib/merch/transfers";
import type { MerchOrderStatus } from "@/lib/merch/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PrintfulWebhookEvent } from "@/lib/printful/webhooks";

/**
 * Apply a verified Printful webhook to a merch order (ADR-024, spec §21).
 *
 * Idempotent + tolerant of out-of-order/duplicate events: shipments upsert on a
 * unique (order_id, printful_shipment_id); status changes are guarded by the
 * state machine (an illegal move is skipped, not thrown); and the creator
 * transfer on first shipment is itself idempotent (lib/merch/transfers.ts). If
 * the payload is uncertain the order status is left alone and reconciliation
 * (spec §36) can repair it from the Printful API.
 */

export type PrintfulFulfilmentOutcome =
  | { status: "processed"; note?: string }
  | { status: "skipped"; note: string };

interface OrderRow {
  id: string;
  status: MerchOrderStatus;
  first_shipped_at: string | null;
  public_reference: string;
  buyer_email: string | null;
}

const ORDER_COLUMNS = "id, status, first_shipped_at, public_reference, buyer_email";

export async function applyPrintfulWebhookEvent(
  event: PrintfulWebhookEvent,
): Promise<PrintfulFulfilmentOutcome> {
  const order = await loadOrder(event);
  if (!order) {
    return { status: "skipped", note: "no matching merch order" };
  }
  const supabase = getSupabaseAdminClient();

  switch (event.kind) {
    case "package_shipped": {
      await recordShipment(order.id, event);
      const firstShipment = !order.first_shipped_at;
      const target: MerchOrderStatus = "shipped";
      await advanceStatus(order, target, {
        fulfilment_status: "shipped",
        ...(firstShipment ? { first_shipped_at: new Date().toISOString() } : {}),
      });
      await recordEvent(order.id, "package_shipped", event, target);
      // Best-effort customer shipping notification (never fails processing).
      await sendMerchOrderShipped({
        toEmail: order.buyer_email,
        publicReference: order.public_reference,
        carrier: event.shipment?.carrier,
        trackingUrl: event.shipment?.trackingUrl,
      }).catch(() => {});
      // First shipment is the default creator-profit release milestone (§17).
      const transfer = await executeCreatorTransfer(order.id);
      return { status: "processed", note: `shipment; transfer=${transfer.status}` };
    }
    case "order_updated": {
      await supabase
        .from("merch_orders")
        .update({ printful_status: event.orderStatus })
        .eq("id", order.id);
      // If Printful reports production, reflect it (guarded).
      if (event.orderStatus === "inprocess" || event.orderStatus === "in_production") {
        await advanceStatus(order, "in_production", { fulfilment_status: "in_production" });
      }
      await recordEvent(order.id, "order_updated", event, null);
      return { status: "processed" };
    }
    case "order_failed": {
      await advanceStatus(order, "on_hold", { fulfilment_status: "failed" });
      await supabase
        .from("merch_orders")
        .update({ reconciliation_error: `printful order failed: ${event.reason ?? "unknown"}` })
        .eq("id", order.id);
      await recordEvent(order.id, "order_failed", event, "on_hold");
      return { status: "processed", note: "order failed — flagged" };
    }
    case "order_put_hold": {
      await advanceStatus(order, "on_hold", { fulfilment_status: "on_hold" });
      await recordEvent(order.id, "order_put_hold", event, "on_hold");
      return { status: "processed" };
    }
    case "order_canceled": {
      await advanceStatus(order, "cancelled", { fulfilment_status: "cancelled" });
      await recordEvent(order.id, "order_canceled", event, "cancelled");
      return { status: "processed" };
    }
    case "package_returned":
    case "order_created":
    case "order_refunded":
    case "unknown":
    default: {
      // Recorded for the timeline; refunds are handled by the admin refund flow.
      await recordEvent(order.id, event.rawType, event, null);
      return { status: "processed", note: `recorded ${event.rawType}` };
    }
  }
}

async function loadOrder(event: PrintfulWebhookEvent): Promise<OrderRow | null> {
  const supabase = getSupabaseAdminClient();
  if (event.externalId) {
    const { data } = await supabase
      .from("merch_orders")
      .select(ORDER_COLUMNS)
      .eq("public_reference", event.externalId)
      .maybeSingle();
    if (data) return data as OrderRow;
  }
  if (event.printfulOrderId !== null) {
    const { data } = await supabase
      .from("merch_orders")
      .select(ORDER_COLUMNS)
      .eq("printful_order_id", String(event.printfulOrderId))
      .maybeSingle();
    if (data) return data as OrderRow;
  }
  return null;
}

/** Guarded status change: no-op if the transition is illegal (out-of-order). */
async function advanceStatus(
  order: OrderRow,
  target: MerchOrderStatus,
  extra: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (order.status === target) {
    // Same status: still apply the side fields (e.g. fulfilment_status).
    await supabase.from("merch_orders").update(extra).eq("id", order.id);
    return;
  }
  if (!canTransitionOrder(order.status, target)) {
    // Illegal transition (e.g. already delivered): apply only the side fields.
    await supabase.from("merch_orders").update(extra).eq("id", order.id);
    return;
  }
  assertOrderTransition(order.status, target);
  await supabase
    .from("merch_orders")
    .update({ status: target, ...extra })
    .eq("id", order.id)
    .eq("status", order.status);
}

async function recordShipment(
  orderId: string,
  event: PrintfulWebhookEvent,
): Promise<void> {
  if (!event.shipment) {
    return;
  }
  const supabase = getSupabaseAdminClient();
  await supabase.from("merch_shipments").upsert(
    {
      order_id: orderId,
      printful_shipment_id: event.shipment.id || null,
      carrier: event.shipment.carrier,
      service: event.shipment.service,
      tracking_number: event.shipment.trackingNumber,
      tracking_url: event.shipment.trackingUrl,
      ship_date: event.shipment.shipDate,
      raw_snapshot: event.shipment,
    },
    { onConflict: "order_id,printful_shipment_id" },
  );
}

async function recordEvent(
  orderId: string,
  eventType: string,
  event: PrintfulWebhookEvent,
  newStatus: MerchOrderStatus | null,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.from("merch_order_events").insert({
    order_id: orderId,
    event_type: eventType,
    source: "printful",
    new_status: newStatus,
    external_event_id: event.externalEventId,
    message: event.reason ?? null,
  });
}
