import "server-only";

import type {
  MerchFulfilmentStatus,
  MerchOrderStatus,
  MerchPaymentStatus,
  MerchRefundStatus,
  MerchTransferStatus,
} from "@/lib/merch/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Merch order queries for the super-admin ops area (ADR-024, spec §25) and the
 * customer order-tracking page (spec §29). Orders are service-role only, so
 * everything here runs on the admin client; callers gate access (owner for the
 * admin views; an unguessable public_reference for the customer view).
 */

export interface AdminOrderSummary {
  id: string;
  publicReference: string;
  creatorId: string;
  buyerEmail: string | null;
  currency: string;
  status: MerchOrderStatus;
  paymentStatus: MerchPaymentStatus;
  fulfilmentStatus: MerchFulfilmentStatus;
  transferStatus: MerchTransferStatus;
  refundStatus: MerchRefundStatus;
  customerTotalMinor: number;
  creatorProfitMinor: number;
  createdAt: string;
  reconciliationError: string | null;
}

const SUMMARY_COLUMNS =
  "id, public_reference, creator_id, buyer_email, currency, status, payment_status, fulfilment_status, transfer_status, refund_status, customer_total_minor, creator_profit_minor, created_at, reconciliation_error";

function toSummary(r: Record<string, unknown>): AdminOrderSummary {
  return {
    id: r.id as string,
    publicReference: r.public_reference as string,
    creatorId: r.creator_id as string,
    buyerEmail: (r.buyer_email as string | null) ?? null,
    currency: r.currency as string,
    status: r.status as MerchOrderStatus,
    paymentStatus: r.payment_status as MerchPaymentStatus,
    fulfilmentStatus: r.fulfilment_status as MerchFulfilmentStatus,
    transferStatus: r.transfer_status as MerchTransferStatus,
    refundStatus: r.refund_status as MerchRefundStatus,
    customerTotalMinor: r.customer_total_minor as number,
    creatorProfitMinor: r.creator_profit_minor as number,
    createdAt: r.created_at as string,
    reconciliationError: (r.reconciliation_error as string | null) ?? null,
  };
}

/** List recent merch orders, optionally filtered by a search term or status. */
export async function listOrdersForAdmin(options: {
  search?: string;
  status?: MerchOrderStatus;
  limit?: number;
} = {}): Promise<AdminOrderSummary[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("merch_orders")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(Math.min(options.limit ?? 50, 200));
  if (options.status) {
    query = query.eq("status", options.status);
  }
  const term = options.search?.trim();
  if (term) {
    // Match on the public reference or buyer email.
    query = query.or(`public_reference.ilike.%${term}%,buyer_email.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) {
    return [];
  }
  return ((data as Record<string, unknown>[]) ?? []).map(toSummary);
}

export interface OrderDetail {
  summary: AdminOrderSummary;
  items: Array<{ title: string; quantity: number; colour: string | null; size: string | null; unitPriceMinor: number }>;
  shipments: Array<{ carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; shipDate: string | null }>;
  events: Array<{ eventType: string; source: string; message: string | null; createdAt: string }>;
  costs: { printfulTotalCostMinor: number; platformFeeMinor: number; shippingChargedMinor: number };
  printfulOrderId: string | null;
}

/** Full detail for one order (admin ops). */
export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data: order } = await supabase
    .from("merch_orders")
    .select(
      `${SUMMARY_COLUMNS}, printful_total_cost_minor, platform_fee_minor, shipping_charged_minor, printful_order_id`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;
  const o = order as Record<string, unknown>;

  const [items, shipments, events] = await Promise.all([
    supabase.from("merch_order_items").select("title, quantity, colour, size, unit_price_minor").eq("order_id", orderId),
    supabase.from("merch_shipments").select("carrier, tracking_number, tracking_url, ship_date").eq("order_id", orderId),
    supabase.from("merch_order_events").select("event_type, source, message, created_at").eq("order_id", orderId).order("created_at", { ascending: true }),
  ]);

  return {
    summary: toSummary(o),
    items: ((items.data as Record<string, unknown>[]) ?? []).map((i) => ({
      title: i.title as string,
      quantity: i.quantity as number,
      colour: (i.colour as string | null) ?? null,
      size: (i.size as string | null) ?? null,
      unitPriceMinor: i.unit_price_minor as number,
    })),
    shipments: ((shipments.data as Record<string, unknown>[]) ?? []).map((sh) => ({
      carrier: (sh.carrier as string | null) ?? null,
      trackingNumber: (sh.tracking_number as string | null) ?? null,
      trackingUrl: (sh.tracking_url as string | null) ?? null,
      shipDate: (sh.ship_date as string | null) ?? null,
    })),
    events: ((events.data as Record<string, unknown>[]) ?? []).map((e) => ({
      eventType: e.event_type as string,
      source: e.source as string,
      message: (e.message as string | null) ?? null,
      createdAt: e.created_at as string,
    })),
    costs: {
      printfulTotalCostMinor: o.printful_total_cost_minor as number,
      platformFeeMinor: o.platform_fee_minor as number,
      shippingChargedMinor: o.shipping_charged_minor as number,
    },
    printfulOrderId: (o.printful_order_id as string | null) ?? null,
  };
}

export interface CustomerOrderStatus {
  publicReference: string;
  status: MerchOrderStatus;
  fulfilmentStatus: MerchFulfilmentStatus;
  currency: string;
  customerTotalMinor: number;
  shipments: Array<{ carrier: string | null; trackingNumber: string | null; trackingUrl: string | null }>;
}

/**
 * Public order status by unguessable reference (spec §29). Exposes only what a
 * customer needs — never internal costs, the creator id or the buyer's address.
 */
export async function getCustomerOrderStatus(
  publicReference: string,
): Promise<CustomerOrderStatus | null> {
  const supabase = getSupabaseAdminClient();
  const { data: order } = await supabase
    .from("merch_orders")
    .select("id, public_reference, status, fulfilment_status, currency, customer_total_minor")
    .eq("public_reference", publicReference)
    .maybeSingle();
  if (!order) return null;
  const o = order as Record<string, unknown>;
  const { data: shipments } = await supabase
    .from("merch_shipments")
    .select("carrier, tracking_number, tracking_url")
    .eq("order_id", o.id as string);
  return {
    publicReference: o.public_reference as string,
    status: o.status as MerchOrderStatus,
    fulfilmentStatus: o.fulfilment_status as MerchFulfilmentStatus,
    currency: o.currency as string,
    customerTotalMinor: o.customer_total_minor as number,
    shipments: ((shipments as Record<string, unknown>[]) ?? []).map((s) => ({
      carrier: (s.carrier as string | null) ?? null,
      trackingNumber: (s.tracking_number as string | null) ?? null,
      trackingUrl: (s.tracking_url as string | null) ?? null,
    })),
  };
}
