import "server-only";

import { recordGiftEvent } from "@/lib/payments/gifts";
import { logPaymentEvent } from "@/lib/payments/log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * The ONLY code path that changes a goal's raised amount (ADR-011). Called
 * exclusively from verified webhook processing and reconciliation — both
 * gated on exactly-once gift status transitions, so replays never
 * double-apply. Delegates to the apply_goal_contribution() SQL function,
 * which is atomic and revoked from every client role.
 */
export async function applyGoalContribution(
  goalId: string,
  delta: number,
  context: { giftId: string; stripeEventId: string; reason: string },
): Promise<boolean> {
  if (delta === 0) {
    return true;
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("apply_goal_contribution", {
    p_goal_id: goalId,
    p_delta: delta,
  });
  if (error) {
    // Never fail the payment flow over goal bookkeeping: log loudly and
    // leave the drift for reconcileGoalProgress() to surface.
    logPaymentEvent("error", "goals.contribution_failed", {
      goal_id: goalId,
      gift_id: context.giftId,
      delta,
      reason: error.message,
    });
    await recordGiftEvent(
      context.giftId,
      "goal_contribution_failed",
      { goal_id: goalId, delta, reason: error.message },
      undefined,
      context.stripeEventId,
    );
    return false;
  }
  await recordGiftEvent(
    context.giftId,
    "goal_contribution_applied",
    { goal_id: goalId, delta, raised_after: data, reason: context.reason },
    undefined,
    context.stripeEventId,
  );
  logPaymentEvent("info", "goals.contribution_applied", {
    goal_id: goalId,
    gift_id: context.giftId,
    delta,
    reason: context.reason,
  });
  return true;
}
