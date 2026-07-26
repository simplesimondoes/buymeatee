import "server-only";

import type { MerchRefundReason, MerchTransferStatus } from "@/lib/merch/types";
import { cancelOrder } from "@/lib/printful/orders";
import { getPrintfulClientOrNull } from "@/lib/printful/client";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-controlled merch refunds (ADR-024, spec §26). MVP does full refunds.
 * Because merch uses SEPARATE charges + transfers, refunding the charge does NOT
 * auto-reverse the creator's transfer — so if the creator was already paid, we
 * create an explicit transfer reversal to claw the profit back. Printful is
 * cancelled where still possible. Refunds are never automatic.
 */

export interface RefundPlanInput {
  customerTotalMinor: number;
  creatorProfitReleasedMinor: number;
  transferStatus: MerchTransferStatus;
}

export interface RefundPlan {
  refundAmountMinor: number;
  /** Reverse the creator transfer (only when profit was actually released). */
  reverseTransfer: boolean;
  reverseAmountMinor: number;
}

/**
 * Pure: decide the refund + whether/how much to claw back from the creator.
 * A full refund of the customer total; reverse the released creator profit if
 * a transfer already went out.
 */
export function computeRefundPlan(order: RefundPlanInput): RefundPlan {
  const reverse =
    order.transferStatus === "transferred" && order.creatorProfitReleasedMinor > 0;
  return {
    refundAmountMinor: order.customerTotalMinor,
    reverseTransfer: reverse,
    reverseAmountMinor: reverse ? order.creatorProfitReleasedMinor : 0,
  };
}

export type RefundOutcome =
  | { status: "refunded"; orderId: string; refundAmountMinor: number; reversed: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; orderId: string; error: string };

interface RefundOrderRow {
  id: string;
  creator_id: string;
  currency: string;
  status: string;
  refund_status: string;
  transfer_status: MerchTransferStatus;
  customer_total_minor: number;
  creator_profit_released_minor: number;
  stripe_charge_id: string | null;
  stripe_transfer_id: string | null;
  printful_order_id: string | null;
  fulfilment_status: string;
}

const REFUND_COLUMNS =
  "id, creator_id, currency, status, refund_status, transfer_status, customer_total_minor, creator_profit_released_minor, stripe_charge_id, stripe_transfer_id, printful_order_id, fulfilment_status";

export async function refundMerchOrder(
  adminId: string,
  orderId: string,
  reason: MerchRefundReason,
): Promise<RefundOutcome> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("merch_orders")
    .select(REFUND_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();
  const order = data as RefundOrderRow | null;
  if (!order) {
    return { status: "skipped", reason: "order-not-found" };
  }
  if (order.refund_status === "refunded") {
    return { status: "skipped", reason: "already-refunded" };
  }
  if (!order.stripe_charge_id) {
    return { status: "skipped", reason: "no-charge" };
  }

  const plan = computeRefundPlan({
    customerTotalMinor: order.customer_total_minor,
    creatorProfitReleasedMinor: order.creator_profit_released_minor,
    transferStatus: order.transfer_status,
  });

  try {
    const stripe = getStripeClient();
    // 1. Refund the customer charge.
    const refund = await stripe.refunds.create(
      { charge: order.stripe_charge_id, reason: "requested_by_customer" },
      { idempotencyKey: `bmat-merch-refund-${order.id}` },
    );

    // 2. Claw back the creator transfer if their profit was already paid out.
    let reversed = false;
    if (plan.reverseTransfer && order.stripe_transfer_id) {
      await stripe.transfers.createReversal(
        order.stripe_transfer_id,
        { amount: plan.reverseAmountMinor },
        { idempotencyKey: `bmat-merch-reversal-${order.id}` },
      );
      reversed = true;
    }

    // 3. Cancel the Printful order where still possible (best-effort).
    const notShipped = !["shipped", "partially_shipped", "delivered"].includes(
      order.fulfilment_status,
    );
    if (order.printful_order_id && notShipped) {
      const printful = getPrintfulClientOrNull();
      if (printful) {
        try {
          await cancelOrder(printful, Number(order.printful_order_id));
        } catch {
          // A cancel failure doesn't block the refund; flag via reconciliation.
        }
      }
    }

    // 4. Persist status + ledger + event.
    await supabase
      .from("merch_orders")
      .update({
        status: "refunded",
        payment_status: "refunded",
        refund_status: "refunded",
        transfer_status: reversed ? ("reversed" satisfies MerchTransferStatus) : order.transfer_status,
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    const common = { order_id: order.id, creator_id: order.creator_id, currency: order.currency, status: "recorded" };
    const ledger: Array<Record<string, unknown>> = [
      { ...common, type: "customer_refund", amount_minor: -plan.refundAmountMinor, stripe_object_id: refund.id, description: `Refund (${reason}).` },
    ];
    if (reversed) {
      ledger.push({ ...common, type: "creator_transfer_reversal", amount_minor: plan.reverseAmountMinor, description: "Creator transfer reversed on refund." });
    }
    await supabase.from("merch_ledger_entries").insert(ledger);
    await supabase.from("merch_order_events").insert({
      order_id: order.id,
      event_type: "refunded",
      source: "admin",
      new_status: "refunded",
      message: `Refunded by admin (${reason}).`,
      payload: { admin_id: adminId, reversed },
    });

    return { status: "refunded", orderId: order.id, refundAmountMinor: plan.refundAmountMinor, reversed };
  } catch (error) {
    return { status: "failed", orderId: order.id, error: (error as Error).message };
  }
}
