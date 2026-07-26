import "server-only";

import type { PrintfulClient } from "@/lib/printful/client";
import { PrintfulError } from "@/lib/printful/errors";
import { parseOrder } from "@/lib/printful/schemas";
import type {
  PrintfulOrder,
  PrintfulOrderItemInput,
  PrintfulRecipient,
} from "@/lib/printful/types";

/**
 * Printful order submission (ADR-024, spec §20). Idempotent by construction:
 * BuyMeATee's public order reference is passed as Printful's `external_id`, and
 * we ALWAYS look the order up by external id before creating one, so a repeated
 * Stripe webhook can never create a second Printful order. lib/merch adds a DB
 * uniqueness guard on top (printful_order_id / printful_external_order_id).
 */

export interface CreatePrintfulOrderInput {
  /** BuyMeATee public order reference — used as Printful external_id. */
  externalId: string;
  recipient: PrintfulRecipient;
  items: PrintfulOrderItemInput[];
  /** "draft" leaves the order unconfirmed for manual review; "auto" confirms. */
  mode: "draft" | "auto";
}

/** GET an order by BuyMeATee external id, or null if Printful has none yet. */
export async function findOrderByExternalId(
  client: PrintfulClient,
  externalId: string,
): Promise<PrintfulOrder | null> {
  try {
    return await client.request({
      method: "GET",
      path: `/orders/@${encodeURIComponent(externalId)}`,
      parse: parseOrder,
    });
  } catch (error) {
    if (error instanceof PrintfulError && error.request?.status === 404) {
      return null;
    }
    throw error;
  }
}

export function getOrder(
  client: PrintfulClient,
  printfulOrderId: number,
): Promise<PrintfulOrder> {
  return client.request({
    method: "GET",
    path: `/orders/${encodeURIComponent(String(printfulOrderId))}`,
    parse: parseOrder,
  });
}

function toApiItem(item: PrintfulOrderItemInput) {
  return {
    variant_id: item.variantId,
    quantity: item.quantity,
    retail_price: item.retailPrice,
    name: item.name,
    files: item.files.map((f) => ({ type: f.type, url: f.url })),
  };
}

function toApiRecipient(r: PrintfulRecipient) {
  return {
    name: r.name,
    address1: r.address1,
    address2: r.address2,
    city: r.city,
    state_code: r.stateCode,
    country_code: r.countryCode,
    zip: r.zip,
    email: r.email,
    phone: r.phone,
  };
}

/**
 * Submit an order to Printful, safely. If an order already exists for this
 * external id it is returned unchanged (no duplicate). Creation is NOT
 * auto-retried by the HTTP layer — the pre-check makes a manual retry safe, and
 * we never want a transient timeout to spawn two orders. `confirm` is derived
 * from the configured order mode.
 */
export async function submitOrder(
  client: PrintfulClient,
  input: CreatePrintfulOrderInput,
): Promise<{ order: PrintfulOrder; alreadyExisted: boolean }> {
  const existing = await findOrderByExternalId(client, input.externalId);
  if (existing) {
    return { order: existing, alreadyExisted: true };
  }

  const order = await client.request({
    method: "POST",
    path: input.mode === "auto" ? "/orders?confirm=1" : "/orders",
    body: {
      external_id: input.externalId,
      recipient: toApiRecipient(input.recipient),
      items: input.items.map(toApiItem),
      confirm: input.mode === "auto",
    },
    parse: parseOrder,
    retry: false,
  });
  return { order, alreadyExisted: false };
}

/** Confirm a previously-created draft order for fulfilment (spec §20). */
export function confirmOrder(
  client: PrintfulClient,
  printfulOrderId: number,
): Promise<PrintfulOrder> {
  return client.request({
    method: "POST",
    path: `/orders/${encodeURIComponent(String(printfulOrderId))}/confirm`,
    parse: parseOrder,
    retry: false,
  });
}

/** Cancel an order where Printful still permits it (used by refunds, spec §26). */
export function cancelOrder(
  client: PrintfulClient,
  printfulOrderId: number,
): Promise<PrintfulOrder> {
  return client.request({
    method: "DELETE",
    path: `/orders/${encodeURIComponent(String(printfulOrderId))}`,
    parse: parseOrder,
    retry: false,
  });
}
