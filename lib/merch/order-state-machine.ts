import type { MerchOrderStatus } from "@/lib/merch/types";

/**
 * Merchandise order state machine (Printful merch MVP, ADR-024, spec §19).
 *
 * Pure module. Restricts invalid transitions so a stray webhook or admin action
 * can't move an order into a nonsensical state (e.g. shipping a refunded order).
 * The DB persists the status; this guards every change and records the previous
 * → new pair on merch_order_events.
 */

const TRANSITIONS: Record<MerchOrderStatus, readonly MerchOrderStatus[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["payment_processing", "paid", "failed", "cancelled"],
  payment_processing: ["paid", "failed", "cancelled"],
  paid: [
    "printful_submission_pending",
    "on_hold",
    "refund_pending",
    "disputed",
    "cancelled",
    "failed",
  ],
  printful_submission_pending: [
    "printful_draft_created",
    "printful_confirmed",
    "failed",
    "on_hold",
    "disputed",
  ],
  printful_draft_created: [
    "printful_confirmed",
    "cancelled",
    "failed",
    "on_hold",
    "disputed",
  ],
  printful_confirmed: [
    "in_production",
    "on_hold",
    "cancelled",
    "failed",
    "disputed",
  ],
  in_production: [
    "partially_shipped",
    "shipped",
    "on_hold",
    "cancelled",
    "disputed",
  ],
  partially_shipped: ["shipped", "delivered", "on_hold", "disputed", "refund_pending"],
  shipped: ["delivered", "partially_refunded", "refunded", "refund_pending", "disputed"],
  delivered: ["partially_refunded", "refunded", "refund_pending", "disputed"],
  on_hold: [
    "paid",
    "printful_submission_pending",
    "printful_confirmed",
    "in_production",
    "cancelled",
    "refund_pending",
    "failed",
    "disputed",
  ],
  failed: ["printful_submission_pending", "refund_pending", "cancelled"],
  refund_pending: ["partially_refunded", "refunded", "cancelled"],
  partially_refunded: ["refunded", "disputed"],
  disputed: ["shipped", "delivered", "partially_refunded", "refunded"],
  // Terminal states.
  cancelled: [],
  refunded: [],
};

const TERMINAL: ReadonlySet<MerchOrderStatus> = new Set(["cancelled", "refunded"]);

export function isTerminalOrderStatus(status: MerchOrderStatus): boolean {
  return TERMINAL.has(status);
}

/** Whether `to` is a permitted next status from `from`. Same-state is false. */
export function canTransitionOrder(
  from: MerchOrderStatus,
  to: MerchOrderStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return TRANSITIONS[from].includes(to);
}

export class InvalidOrderTransitionError extends Error {
  constructor(
    readonly from: MerchOrderStatus,
    readonly to: MerchOrderStatus,
  ) {
    super(`Invalid merch order transition: ${from} → ${to}.`);
    this.name = "InvalidOrderTransitionError";
  }
}

/** Throw unless the transition is allowed. Use before persisting a status change. */
export function assertOrderTransition(
  from: MerchOrderStatus,
  to: MerchOrderStatus,
): void {
  if (!canTransitionOrder(from, to)) {
    throw new InvalidOrderTransitionError(from, to);
  }
}
