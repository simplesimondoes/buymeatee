import "server-only";

import { getCreatorTransferReleasePolicy, getMerchFlags } from "@/lib/merch/config";
import { evaluateTransferEligibility } from "@/lib/merch/earnings";
import type { MerchOrderStatus, MerchTransferStatus } from "@/lib/merch/types";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import { canReceiveGifts } from "@/lib/payments/types";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Creator profit transfers (ADR-024, spec §17). The ONLY amount transferred is
 * the creator's profit — never the retail price, shipping or tax. Uses Stripe
 * separate transfers to the connected account, tied to the order's transfer
 * group. Idempotent by construction: a per-order idempotency key, an optimistic
 * status guard, and the DB's one-transfer-per-order unique ledger index all
 * prevent a double payout.
 *
 * Auto-release respects MERCH_AUTOMATIC_CREATOR_TRANSFERS_ENABLED; an admin can
 * force a manual transfer (force: true) regardless. Immediately before the
 * transfer the connected account is re-checked (spec §17).
 */

export type TransferOutcome =
  | { status: "transferred"; orderId: string; amountMinor: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; orderId: string; error: string };

interface TransferOrderRow {
  id: string;
  creator_id: string;
  currency: string;
  status: MerchOrderStatus;
  transfer_status: MerchTransferStatus;
  creator_profit_minor: number;
  creator_profit_released_minor: number;
  stripe_transfer_group: string | null;
  public_reference: string;
}

const TRANSFER_COLUMNS =
  "id, creator_id, currency, status, transfer_status, creator_profit_minor, creator_profit_released_minor, stripe_transfer_group, public_reference";

export async function executeCreatorTransfer(
  orderId: string,
  options: { force?: boolean } = {},
): Promise<TransferOutcome> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("merch_orders")
    .select(TRANSFER_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();
  const order = data as TransferOrderRow | null;
  if (!order) {
    return { status: "skipped", reason: "order-not-found" };
  }

  const flags = getMerchFlags();
  if (!options.force && !flags.automaticCreatorTransfersEnabled) {
    return { status: "skipped", reason: "auto-transfers-disabled" };
  }

  // Re-check the connected account right before moving money.
  const account = await getConnectedAccountForUser(order.creator_id);
  const connectedAccountReady = Boolean(account && canReceiveGifts(account));

  const eligibility = evaluateTransferEligibility({
    policy: getCreatorTransferReleasePolicy(),
    orderStatus: order.status,
    transferStatus: order.transfer_status,
    creatorProfitMinor: order.creator_profit_minor,
    creatorProfitReleasedMinor: order.creator_profit_released_minor,
    connectedAccountReady,
  });
  // force lets an admin release despite a non-milestone policy, but NEVER
  // despite a hold (dispute/refund), no-profit, already-transferred, or an
  // unready account.
  const hardBlock =
    eligibility.reason === "already-transferred" ||
    eligibility.reason === "no-profit" ||
    eligibility.reason === "order-on-hold" ||
    eligibility.reason === "connected-account-not-ready";
  if (!eligibility.due && (!options.force || hardBlock)) {
    return { status: "skipped", reason: eligibility.reason ?? "not-due" };
  }
  const amountMinor =
    eligibility.amountMinor > 0
      ? eligibility.amountMinor
      : order.creator_profit_minor - order.creator_profit_released_minor;
  if (amountMinor <= 0 || !account) {
    return { status: "skipped", reason: "no-profit" };
  }

  // Claim the transfer: flip none/failed → pending so a concurrent runner loses.
  const { data: claimed } = await supabase
    .from("merch_orders")
    .update({ transfer_status: "pending" satisfies MerchTransferStatus })
    .eq("id", order.id)
    .in("transfer_status", ["none", "transfer_failed", "held"])
    .select("id")
    .maybeSingle();
  if (!claimed) {
    return { status: "skipped", reason: "already-claimed" };
  }

  try {
    const stripe = getStripeClient();
    const transfer = await stripe.transfers.create(
      {
        amount: amountMinor,
        currency: order.currency,
        destination: account.stripe_account_id,
        transfer_group: order.stripe_transfer_group ?? order.public_reference,
        metadata: {
          order_type: "merch",
          order_id: order.id,
          public_order_reference: order.public_reference,
        },
      },
      { idempotencyKey: `bmat-merch-transfer-${order.id}` },
    );

    await supabase
      .from("merch_orders")
      .update({
        transfer_status: "transferred" satisfies MerchTransferStatus,
        stripe_transfer_id: transfer.id,
        creator_profit_released_minor: order.creator_profit_released_minor + amountMinor,
      })
      .eq("id", order.id);

    await supabase.from("merch_ledger_entries").insert({
      order_id: order.id,
      creator_id: order.creator_id,
      type: "creator_transfer",
      amount_minor: -amountMinor,
      currency: order.currency,
      status: "recorded",
      stripe_object_id: transfer.id,
      description: "Creator profit transferred.",
    });
    await supabase.from("merch_order_events").insert({
      order_id: order.id,
      event_type: "creator_transfer",
      source: "system",
      message: `Transferred ${amountMinor} ${order.currency} to creator.`,
    });

    return { status: "transferred", orderId: order.id, amountMinor };
  } catch (error) {
    // Keep the order active; mark the transfer failed for a safe retry (§17).
    await supabase
      .from("merch_orders")
      .update({ transfer_status: "transfer_failed" satisfies MerchTransferStatus })
      .eq("id", order.id);
    await supabase.from("merch_order_events").insert({
      order_id: order.id,
      event_type: "creator_transfer_failed",
      source: "system",
      message: (error as Error).message,
    });
    return { status: "failed", orderId: order.id, error: (error as Error).message };
  }
}
