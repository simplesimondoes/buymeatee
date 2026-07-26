import { goalProgressPercent } from "@/lib/goals/types";
import { MILESTONE_PERCENTS, type MilestonePercent } from "@/lib/journey/types";

/**
 * Which honest progress milestones a goal crossed as its raised total moved
 * from `raisedBefore` to `raisedAfter`. Pure and framework-free so it can be
 * unit-tested and used from the verified webhook path.
 *
 * Progress uses the SAME capped whole-percent the public page shows
 * (goalProgressPercent), so a milestone can never claim more than reality:
 * 100 only registers when the target is actually met. A milestone is "crossed"
 * when the threshold sits above the old percent and at or below the new one —
 * so a single large gift can cross several at once (e.g. 49% → 76% → [50, 75]).
 */
export function milestonesCrossed(
  raisedBefore: number,
  raisedAfter: number,
  targetAmount: number,
): MilestonePercent[] {
  if (targetAmount <= 0) {
    return [];
  }
  const before = goalProgressPercent(Math.max(0, raisedBefore), targetAmount);
  const after = goalProgressPercent(Math.max(0, raisedAfter), targetAmount);
  if (after <= before) {
    return [];
  }
  return MILESTONE_PERCENTS.filter((m) => before < m && m <= after);
}
