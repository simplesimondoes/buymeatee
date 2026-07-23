import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Goal domain types mirroring supabase/migrations/*_creator_goals.sql.
 * Amounts are integer minor units throughout. raised_amount is maintained
 * only by verified webhook processing (ADR-011) — treat it as read-only
 * everywhere outside lib/payments/webhooks.ts.
 */

export const GOAL_STATUSES = [
  "draft",
  "active",
  "completed",
  "archived",
] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

/** Keep in sync with enforce_active_goal_limit() in the migration. */
export const MAX_ACTIVE_GOALS = 3;

export const GOAL_TITLE_MAX_LENGTH = 120;
export const GOAL_DESCRIPTION_MAX_LENGTH = 1000;
/** £50,000.00 / €50.000,00 — a season-scale ambition, not a fundraising cap. */
export const GOAL_TARGET_MAX_MINOR = 5_000_000;

export interface CreatorGoalRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  currency: SupportedCurrency;
  target_amount: number;
  raised_amount: number;
  status: GoalStatus;
  sort_order: number;
  /** Admin takedown (issue #28). Non-null blocks publishing until restored. */
  taken_down_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isGoalStatus(value: unknown): value is GoalStatus {
  return (
    typeof value === "string" &&
    (GOAL_STATUSES as readonly string[]).includes(value)
  );
}

/** Statuses shown on the public creator page. Mirrors the RLS select policy. */
export function isPubliclyVisible(status: GoalStatus): boolean {
  return status === "active" || status === "completed";
}

/**
 * Allowed lifecycle moves. Completion is always the creator's call — goals
 * never auto-complete at target, and over-target is displayed honestly.
 * Archived goals can be revived to draft (subject to the active limit when
 * they are re-published).
 */
const GOAL_TRANSITIONS: Record<GoalStatus, readonly GoalStatus[]> = {
  draft: ["active", "archived"],
  active: ["completed", "archived", "draft"],
  completed: ["archived", "active"],
  archived: ["draft"],
};

export function canTransitionGoal(from: GoalStatus, to: GoalStatus): boolean {
  return GOAL_TRANSITIONS[from].includes(to);
}

/**
 * Whole percent for progress display, capped at 100 for bar widths.
 * Over-target totals stay visible through the formatted amounts instead.
 */
export function goalProgressPercent(
  raisedAmount: number,
  targetAmount: number,
): number {
  if (targetAmount <= 0 || raisedAmount <= 0) {
    return 0;
  }
  return Math.min(100, Math.floor((raisedAmount / targetAmount) * 100));
}
