import type { CreatorTransferReleasePolicy } from "@/lib/merch/config";
import type {
  MerchOrderStatus,
  MerchTransferStatus,
} from "@/lib/merch/types";

/**
 * Creator merchandise earnings + transfer eligibility (ADR-024, spec §17/§27).
 *
 * Pure module. The ONLY amount ever transferred to a creator is their profit;
 * shipping and tax are never earnings (enforced upstream in pricing). This
 * decides WHEN a transfer becomes due under the configured release policy, and
 * refuses to release funds that are disputed, refunded, already transferred, or
 * on an ineligible order. lib/merch performs the transfer behind an idempotency
 * guard using this verdict.
 */

/** Order statuses at/after which the goods are considered shipped. */
const SHIPPED_STATUSES: ReadonlySet<MerchOrderStatus> = new Set([
  "partially_shipped",
  "shipped",
  "delivered",
]);

/** Order statuses at/after which Printful production has started. */
const FULFILMENT_STARTED_STATUSES: ReadonlySet<MerchOrderStatus> = new Set([
  "in_production",
  "partially_shipped",
  "shipped",
  "delivered",
]);

/** Order statuses at/after which Printful has confirmed the order. */
const CONFIRMED_STATUSES: ReadonlySet<MerchOrderStatus> = new Set([
  "printful_confirmed",
  "in_production",
  "partially_shipped",
  "shipped",
  "delivered",
]);

/** Statuses that must HOLD any creator transfer (money at risk / clawed back). */
const HOLD_STATUSES: ReadonlySet<MerchOrderStatus> = new Set([
  "disputed",
  "refund_pending",
  "partially_refunded",
  "refunded",
  "cancelled",
  "failed",
  "on_hold",
]);

export type TransferBlockReason =
  | "already-transferred"
  | "no-profit"
  | "order-on-hold"
  | "connected-account-not-ready"
  | "policy-manual"
  | "milestone-not-reached";

export interface TransferEligibilityInput {
  policy: CreatorTransferReleasePolicy;
  orderStatus: MerchOrderStatus;
  transferStatus: MerchTransferStatus;
  creatorProfitMinor: number;
  creatorProfitReleasedMinor: number;
  /** canReceiveGifts(account) at transfer time (re-checked just before). */
  connectedAccountReady: boolean;
}

export interface TransferEligibility {
  due: boolean;
  /** Amount to transfer now (profit not yet released), minor units. */
  amountMinor: number;
  reason?: TransferBlockReason;
}

function milestoneReached(
  policy: CreatorTransferReleasePolicy,
  status: MerchOrderStatus,
): boolean {
  switch (policy) {
    case "manual":
      return false; // released only by an explicit admin action
    case "on_printful_confirmation":
      return CONFIRMED_STATUSES.has(status);
    case "on_fulfilment_started":
      return FULFILMENT_STARTED_STATUSES.has(status);
    case "on_first_shipment":
      return SHIPPED_STATUSES.has(status);
  }
}

/**
 * Decide whether a creator transfer is due for an order under the given policy.
 * Never returns due=true for a disputed/refunded/held order, an order with no
 * remaining profit, an already-completed transfer, or an ineligible connected
 * account. The `manual` policy is never automatically due (admin-triggered).
 */
export function evaluateTransferEligibility(
  input: TransferEligibilityInput,
): TransferEligibility {
  const remaining = input.creatorProfitMinor - input.creatorProfitReleasedMinor;

  if (input.transferStatus === "transferred" || input.transferStatus === "reversed") {
    return { due: false, amountMinor: 0, reason: "already-transferred" };
  }
  if (input.creatorProfitMinor <= 0 || remaining <= 0) {
    return { due: false, amountMinor: 0, reason: "no-profit" };
  }
  if (HOLD_STATUSES.has(input.orderStatus)) {
    return { due: false, amountMinor: 0, reason: "order-on-hold" };
  }
  if (!input.connectedAccountReady) {
    return { due: false, amountMinor: 0, reason: "connected-account-not-ready" };
  }
  if (input.policy === "manual") {
    return { due: false, amountMinor: 0, reason: "policy-manual" };
  }
  if (!milestoneReached(input.policy, input.orderStatus)) {
    return { due: false, amountMinor: 0, reason: "milestone-not-reached" };
  }
  return { due: true, amountMinor: remaining };
}

/** Aggregate earnings buckets for a creator's merch dashboard (spec §12). */
export interface EarningsBuckets {
  pendingMinor: number;
  approvedMinor: number;
  transferredMinor: number;
  reversedMinor: number;
  refundedMinor: number;
}

/**
 * Bucket a single order's profit for the earnings view. Pure and per-order so
 * the dashboard can sum across orders (per currency — never mixed).
 */
export function bucketOrderEarnings(input: {
  orderStatus: MerchOrderStatus;
  transferStatus: MerchTransferStatus;
  creatorProfitMinor: number;
  creatorProfitReleasedMinor: number;
}): EarningsBuckets {
  const zero: EarningsBuckets = {
    pendingMinor: 0,
    approvedMinor: 0,
    transferredMinor: 0,
    reversedMinor: 0,
    refundedMinor: 0,
  };
  const profit = input.creatorProfitMinor;
  if (profit <= 0) {
    return zero;
  }
  if (input.transferStatus === "reversed") {
    return { ...zero, reversedMinor: profit };
  }
  if (input.orderStatus === "refunded") {
    return { ...zero, refundedMinor: profit };
  }
  if (input.transferStatus === "transferred") {
    return { ...zero, transferredMinor: input.creatorProfitReleasedMinor };
  }
  // Not yet transferred: pending while at risk / pre-milestone, else approved.
  const atRisk =
    input.orderStatus === "disputed" ||
    input.orderStatus === "refund_pending" ||
    input.orderStatus === "on_hold";
  return atRisk
    ? { ...zero, pendingMinor: profit }
    : { ...zero, approvedMinor: profit };
}
