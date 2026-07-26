import "server-only";

import {
  sendMerchOrderConfirmation,
  sendMerchSaleRecorded,
} from "@/lib/email/merch-notify";
import { assertOrderTransition, canTransitionOrder } from "@/lib/merch/order-state-machine";
import type { MerchOrderStatus } from "@/lib/merch/types";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Verified merchandise payment handling (ADR-024, spec §17). Mirrors the gift
 * verify-then-fulfill pattern (lib/payments/webhooks.ts markGiftPaidVerified):
 * before marking an order paid we re-check the Stripe PaymentIntent against the
 * stored order and refuse on any mismatch (recording a reconciliation error)
 * rather than trusting the event. The browser redirect is NEVER proof of
 * payment; only this webhook-driven path marks an order paid.
 *
 * Merch uses SEPARATE charges + transfers: the platform collects the full
 * customer total here (no transfer_data), and the creator's profit is
 * transferred later, only when the release milestone is reached (lib/merch/
 * transfers.ts). So at payment time there is no destination to verify — only
 * amount, currency, livemode and the order id in metadata.
 */

/** The minimal order shape the mismatch check needs (stored values). */
export interface MerchOrderPaymentFacts {
  id: string;
  currency: string;
  customerTotalMinor: number;
  livemode: boolean;
  status: MerchOrderStatus;
}

/** The minimal PaymentIntent shape the mismatch check needs (from Stripe). */
export interface MerchPaymentIntentFacts {
  livemode: boolean;
  amount: number;
  currency: string;
  metadataOrderId?: string | null;
}

/**
 * Pure: list every way the PaymentIntent disagrees with the stored order. An
 * empty list means the payment is safe to apply. Any entry means we must flag a
 * reconciliation error instead of marking the order paid.
 */
export function computeMerchOrderMismatches(
  order: MerchOrderPaymentFacts,
  pi: MerchPaymentIntentFacts,
): string[] {
  const mismatches: string[] = [];
  if (pi.livemode !== order.livemode) {
    mismatches.push("livemode");
  }
  if (pi.amount !== order.customerTotalMinor) {
    mismatches.push("amount");
  }
  if (pi.currency.toLowerCase() !== order.currency.toLowerCase()) {
    mismatches.push("currency");
  }
  if (pi.metadataOrderId && pi.metadataOrderId !== order.id) {
    mismatches.push("metadata_order_id");
  }
  return mismatches;
}

export type MerchPaidOutcome =
  | { status: "processed"; orderId: string }
  | { status: "skipped"; note: string }
  | { status: "reconciliation_error"; orderId: string; mismatches: string[] };

/** The paid-family statuses an order must never be downgraded from. */
const PAID_FAMILY: ReadonlySet<MerchOrderStatus> = new Set([
  "paid",
  "printful_submission_pending",
  "printful_draft_created",
  "printful_confirmed",
  "in_production",
  "partially_shipped",
  "shipped",
  "delivered",
  "partially_refunded",
  "refunded",
  "disputed",
]);

interface StripeChargeIds {
  chargeId?: string | null;
  balanceTransactionId?: string | null;
  transferGroup?: string | null;
}

/**
 * Mark a merch order paid, verified against the PaymentIntent, exactly once.
 * Idempotent: a replayed webhook that finds the order already in the paid family
 * is acknowledged without change. On any mismatch the order is flagged for
 * reconciliation and NOT advanced (so fulfilment/transfer never run on a
 * suspect payment). Bookkeeping (ledger, event) never fails the payment path.
 */
export async function markMerchOrderPaidVerified(
  order: MerchOrderPaymentFacts & { creatorId: string; platformFeeMinor: number; creatorProfitMinor: number; printfulTotalCostMinor: number },
  pi: MerchPaymentIntentFacts & StripeChargeIds,
  eventId: string,
): Promise<MerchPaidOutcome> {
  // Idempotency: already paid (or beyond) → ack, do nothing.
  if (PAID_FAMILY.has(order.status)) {
    return { status: "skipped", note: "already paid" };
  }
  if (!canTransitionOrder(order.status, "paid")) {
    return { status: "skipped", note: `cannot pay from ${order.status}` };
  }

  const mismatches = computeMerchOrderMismatches(order, pi);
  const supabase = getSupabaseAdminClient();

  if (mismatches.length > 0) {
    await supabase
      .from("merch_orders")
      .update({ reconciliation_error: `payment mismatch: ${mismatches.join(",")}` })
      .eq("id", order.id);
    await recordOrderEvent(order.id, "reconciliation_error", "stripe", {
      previous: order.status,
      next: null,
      externalEventId: eventId,
      message: `PaymentIntent mismatched: ${mismatches.join(", ")}`,
    });
    return { status: "reconciliation_error", orderId: order.id, mismatches };
  }

  // Guarded, optimistic-locked transition to paid (loses cleanly on a race).
  assertOrderTransition(order.status, "paid");
  const { data, error } = await supabase
    .from("merch_orders")
    .update({
      status: "paid" satisfies MerchOrderStatus,
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_charge_id: pi.chargeId ?? null,
      stripe_balance_transaction_id: pi.balanceTransactionId ?? null,
      stripe_transfer_group: pi.transferGroup ?? null,
    })
    .eq("id", order.id)
    .eq("status", order.status)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    // Either a concurrent transition won, or a transient failure. A replay will
    // reconcile via the idempotency guard above.
    return { status: "skipped", note: "transition lost or failed" };
  }

  // Ledger: record the customer payment, the reserved Printful cost, the
  // platform fee and the (not-yet-transferred) creator earning. Best-effort.
  await recordLedger(order, pi);
  await recordOrderEvent(order.id, "order_paid", "stripe", {
    previous: order.status,
    next: "paid",
    externalEventId: eventId,
    message: "Payment verified.",
  });

  return { status: "processed", orderId: order.id };
}

const ORDER_PAYMENT_COLUMNS =
  "id, public_reference, creator_id, buyer_email, currency, customer_total_minor, platform_fee_minor, creator_profit_minor, printful_total_cost_minor, livemode, status, stripe_payment_intent_id";

interface OrderPaymentRow {
  id: string;
  public_reference: string;
  creator_id: string;
  buyer_email: string | null;
  currency: string;
  customer_total_minor: number;
  platform_fee_minor: number;
  creator_profit_minor: number;
  printful_total_cost_minor: number;
  livemode: boolean;
  status: MerchOrderStatus;
}

/**
 * Webhook entry point (called from lib/payments/webhooks.ts on a
 * payment_intent.succeeded whose metadata.order_type === "merch"). Loads the
 * order by its metadata id or PaymentIntent id, then verifies + marks it paid.
 * Stripe types stay in the webhook layer; this takes plain normalised fields.
 */
export async function applyMerchPaymentSucceeded(input: {
  paymentIntentId: string;
  metadataOrderId?: string | null;
  livemode: boolean;
  amount: number;
  currency: string;
  chargeId?: string | null;
  balanceTransactionId?: string | null;
  transferGroup?: string | null;
  eventId: string;
}): Promise<MerchPaidOutcome> {
  const order = await loadOrderForPayment(input.metadataOrderId, input.paymentIntentId);
  if (!order) {
    return { status: "skipped", note: "no matching merch order" };
  }
  const outcome = await markMerchOrderPaidVerified(
    {
      id: order.id,
      currency: order.currency,
      customerTotalMinor: order.customer_total_minor,
      livemode: order.livemode,
      status: order.status,
      creatorId: order.creator_id,
      platformFeeMinor: order.platform_fee_minor,
      creatorProfitMinor: order.creator_profit_minor,
      printfulTotalCostMinor: order.printful_total_cost_minor,
    },
    {
      livemode: input.livemode,
      amount: input.amount,
      currency: input.currency,
      metadataOrderId: input.metadataOrderId,
      chargeId: input.chargeId,
      balanceTransactionId: input.balanceTransactionId,
      transferGroup: input.transferGroup,
    },
    input.eventId,
  );
  // Best-effort notifications (never fail the payment path).
  if (outcome.status === "processed") {
    await notifyOnPaid(order);
  }
  return outcome;
}

async function notifyOnPaid(order: OrderPaymentRow): Promise<void> {
  try {
    const currency = order.currency as SupportedCurrency;
    await Promise.allSettled([
      sendMerchOrderConfirmation({
        toEmail: order.buyer_email,
        publicReference: order.public_reference,
        total: order.customer_total_minor,
        currency,
      }),
      sendMerchSaleRecorded({
        creatorUserId: order.creator_id,
        productTitle: "",
        profit: order.creator_profit_minor,
        currency,
      }),
    ]);
  } catch {
    // Notifications are best-effort; drift is fine.
  }
}

/** Webhook entry for a failed merch PaymentIntent. */
export async function applyMerchPaymentFailed(input: {
  paymentIntentId: string;
  metadataOrderId?: string | null;
  eventId: string;
}): Promise<MerchPaidOutcome> {
  const order = await loadOrderForPayment(input.metadataOrderId, input.paymentIntentId);
  if (!order) {
    return { status: "skipped", note: "no matching merch order" };
  }
  if (PAID_FAMILY.has(order.status)) {
    // A later success already won; ignore the failure event.
    return { status: "skipped", note: "already paid" };
  }
  if (!canTransitionOrder(order.status, "failed")) {
    return { status: "skipped", note: `cannot fail from ${order.status}` };
  }
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("merch_orders")
    .update({ status: "failed" satisfies MerchOrderStatus, payment_status: "failed" })
    .eq("id", order.id)
    .eq("status", order.status);
  await recordOrderEvent(order.id, "payment_failed", "stripe", {
    previous: order.status,
    next: "failed",
    externalEventId: input.eventId,
  });
  return { status: "processed", orderId: order.id };
}

async function loadOrderForPayment(
  metadataOrderId: string | null | undefined,
  paymentIntentId: string,
): Promise<OrderPaymentRow | null> {
  const supabase = getSupabaseAdminClient();
  if (metadataOrderId) {
    const { data } = await supabase
      .from("merch_orders")
      .select(ORDER_PAYMENT_COLUMNS)
      .eq("id", metadataOrderId)
      .maybeSingle();
    if (data) return data as OrderPaymentRow;
  }
  const { data } = await supabase
    .from("merch_orders")
    .select(ORDER_PAYMENT_COLUMNS)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  return (data as OrderPaymentRow | null) ?? null;
}

async function recordLedger(
  order: MerchOrderPaymentFacts & {
    creatorId: string;
    platformFeeMinor: number;
    creatorProfitMinor: number;
    printfulTotalCostMinor: number;
  },
  pi: StripeChargeIds,
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const common = {
      order_id: order.id,
      creator_id: order.creatorId,
      currency: order.currency,
      status: "recorded",
    };
    await supabase.from("merch_ledger_entries").insert([
      {
        ...common,
        type: "customer_payment",
        amount_minor: order.customerTotalMinor,
        stripe_object_id: pi.chargeId ?? null,
        description: "Customer merchandise payment received.",
      },
      {
        ...common,
        type: "printful_reserve",
        amount_minor: -order.printfulTotalCostMinor,
        description: "Reserved for Printful production, shipping and tax.",
      },
      {
        ...common,
        type: "platform_fee",
        amount_minor: order.platformFeeMinor,
        description: "BuyMeATee merchandise fee.",
      },
      {
        ...common,
        type: "creator_earning",
        amount_minor: order.creatorProfitMinor,
        description: "Creator profit (pending transfer).",
      },
    ]);
  } catch {
    // Ledger drift is reconciled separately; never fail the payment path.
  }
}

async function recordOrderEvent(
  orderId: string,
  eventType: string,
  source: "system" | "stripe" | "printful" | "admin" | "creator" | "customer",
  detail: {
    previous?: MerchOrderStatus | null;
    next?: MerchOrderStatus | null;
    externalEventId?: string | null;
    message?: string;
  },
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("merch_order_events").insert({
      order_id: orderId,
      event_type: eventType,
      source,
      previous_status: detail.previous ?? null,
      new_status: detail.next ?? null,
      external_event_id: detail.externalEventId ?? null,
      message: detail.message ?? null,
    });
  } catch {
    // Audit best-effort.
  }
}
