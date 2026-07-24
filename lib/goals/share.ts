import { goalProgressPercent } from "@/lib/goals/types";

/**
 * Milestone detection and share copy for creator-initiated sharing.
 *
 * Framework-free and pure so it can be unit-tested and used from both server
 * (OG card, metadata) and client (share controls) code. Every message is
 * first-person — the creator posts it from their own account — and uses only
 * real, honest progress: the same capped whole-percent the public page shows.
 * No supporter counts or amounts are invented (CLAUDE.md hard rules), and the
 * brand vocabulary is respected (journey / support / Tee — never "donation"
 * or "crowdfunding").
 */

/** Progress thresholds worth celebrating, ascending. */
export const GOAL_MILESTONES = [25, 50, 75, 100] as const;

export type GoalMilestone = (typeof GOAL_MILESTONES)[number];

/**
 * The highest milestone a goal's honest progress has reached, or null when it
 * is under the first threshold. 100 requires the target to actually be met.
 */
export function reachedMilestone(
  raisedAmount: number,
  targetAmount: number,
): GoalMilestone | null {
  const percent = goalProgressPercent(raisedAmount, targetAmount);
  let reached: GoalMilestone | null = null;
  for (const milestone of GOAL_MILESTONES) {
    if (percent >= milestone) {
      reached = milestone;
    }
  }
  return reached;
}

/** Keep a title readable inside a post without eating the whole message. */
const TITLE_MAX = 80;

function trimTitle(title: string): string {
  const clean = title.trim();
  return clean.length > TITLE_MAX ? `${clean.slice(0, TITLE_MAX - 1).trimEnd()}…` : clean;
}

/** Share copy for a creator's whole page (no single goal in focus). */
export function pageShareText(): string {
  return "Follow my golf journey on BuyMeATee — back a real goal and help me get there. ⛳️";
}

/**
 * Share copy for a specific goal, tuned to how far along it is:
 * funded (100%), in-progress milestone (25/50/75%), or just getting started.
 */
export function goalShareText(
  goalTitle: string,
  raisedAmount: number,
  targetAmount: number,
): string {
  const title = trimTitle(goalTitle);
  const percent = goalProgressPercent(raisedAmount, targetAmount);
  const milestone = reachedMilestone(raisedAmount, targetAmount);

  if (milestone === 100) {
    return `“${title}” is funded! 🎉 Huge thanks to everyone who backed the journey on BuyMeATee. On to the next one.`;
  }
  if (milestone) {
    return `${percent}% of the way to “${title}” on BuyMeATee 🏌️ Thank you to everyone backing the journey — help me reach the goal.`;
  }
  return `I'm working towards “${title}” on my BuyMeATee page. Support the journey and help me get there. ⛳️`;
}

/**
 * Share copy for a goal the creator has marked completed. Completion is the
 * creator's call and may happen at any total, so this celebrates the milestone
 * without asserting a funding level.
 */
export function completedGoalShareText(goalTitle: string): string {
  return `“${trimTitle(goalTitle)}” — another goal reached on my BuyMeATee journey. Thank you to everyone who backed it. ⛳️`;
}
