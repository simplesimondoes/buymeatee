import { goalProgressPercent } from "@/lib/goals/types";

/**
 * Milestone detection and share-copy selection for creator-initiated sharing.
 *
 * Framework-free and pure so it can be unit-tested and used from both server
 * and client code. The English copy itself lives in messages/en/gifts.json
 * under `share.*` (ADR-019) — this module only decides WHICH message applies
 * and with which honest params. Every message is first-person — the creator
 * posts it from their own account — and uses only real progress: the same
 * capped whole-percent the public page shows. No supporter counts or amounts
 * are invented (CLAUDE.md hard rules), and the brand vocabulary is respected
 * (journey / support / Tee — never "donation" or "crowdfunding"). Goal and
 * item titles are quoted verbatim (user content, never translated).
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

/** Exported for tests; internal use only otherwise. */
export function trimShareTitle(title: string): string {
  const clean = title.trim();
  return clean.length > TITLE_MAX ? `${clean.slice(0, TITLE_MAX - 1).trimEnd()}…` : clean;
}

/**
 * A share message reference: a key inside the `gifts` namespace's `share.*`
 * messages plus its ICU params. ShareControls (or any translator with the
 * `gifts` namespace) renders it in the creator's language.
 */
export type ShareMessage = {
  key:
    | "page"
    | "pageLive"
    | "goalFunded"
    | "goalMilestone"
    | "goalStarting"
    | "goalCompleted"
    | "supportGoal"
    | "supportWishlist"
    | "supportGeneral"
    | "updatePublished"
    | "wishlistFunded"
    | "supporterGoal"
    | "supporterWishlist"
    | "supporterGeneral";
  params?: { title?: string; percent?: number; name?: string };
};

/** Share copy for a creator's whole page (no single goal in focus). */
export function pageShareText(): ShareMessage {
  return { key: "page" };
}

/**
 * Launch-flavoured share copy for the moment a creator's page first goes
 * live (username claimed). Same honest content as `page`, more celebration.
 */
export function pageLiveShareText(): ShareMessage {
  return { key: "pageLive" };
}

/**
 * Share copy for a specific goal, tuned to how far along it is:
 * funded (100%), in-progress milestone (25/50/75%), or just getting started.
 */
export function goalShareText(
  goalTitle: string,
  raisedAmount: number,
  targetAmount: number,
): ShareMessage {
  const title = trimShareTitle(goalTitle);
  const percent = goalProgressPercent(raisedAmount, targetAmount);
  const milestone = reachedMilestone(raisedAmount, targetAmount);

  if (milestone === 100) {
    return { key: "goalFunded", params: { title } };
  }
  if (milestone) {
    return { key: "goalMilestone", params: { title, percent } };
  }
  return { key: "goalStarting", params: { title } };
}

/**
 * Share copy for a goal the creator has marked completed. Completion is the
 * creator's call and may happen at any total, so this celebrates the milestone
 * without asserting a funding level.
 */
export function completedGoalShareText(goalTitle: string): ShareMessage {
  return { key: "goalCompleted", params: { title: trimShareTitle(goalTitle) } };
}

/**
 * Share copy for a single Tee a creator just received, so they can rally their
 * audience off the back of real support. Deliberately count- and amount-free
 * (CLAUDE.md hard rules) — it celebrates that support happened, not how much,
 * and never names the supporter. `target` is what the Tee funded, if anything.
 */
export function supportShareText(
  target: { label: string; toward: boolean } | null,
): ShareMessage {
  if (target?.toward) {
    return { key: "supportGoal", params: { title: trimShareTitle(target.label) } };
  }
  if (target) {
    return {
      key: "supportWishlist",
      params: { title: trimShareTitle(target.label) },
    };
  }
  return { key: "supportGeneral" };
}

/**
 * Share copy for a progress update the creator just published. The update
 * title is quoted verbatim (user content); the body is deliberately not
 * summarised here — anything beyond the title is the creator's own edit.
 */
export function updateShareText(updateTitle: string): ShareMessage {
  return {
    key: "updatePublished",
    params: { title: trimShareTitle(updateTitle) },
  };
}

/**
 * Share copy for a wish-list item a supporter fully funded (ADR-018). Only
 * ever selected for the webhook-verified `funded` state, so the celebration
 * is honest by construction. Amount- and name-free like the other messages.
 */
export function wishlistFundedShareText(itemTitle: string): ShareMessage {
  return {
    key: "wishlistFunded",
    params: { title: trimShareTitle(itemTitle) },
  };
}

/**
 * Share copy for the SUPPORTER after a webhook-verified payment — the one
 * voice in this module that isn't the creator's. First-person from the
 * supporter, names the creator by their public display name, and never
 * mentions the amount, so posting it reveals nothing a public page doesn't.
 * Sharing is always the supporter's explicit choice (never automatic).
 */
export function supporterShareText(
  recipientName: string,
  target: { kind: "goal" | "wishlist"; title: string } | null,
): ShareMessage {
  const name = trimShareTitle(recipientName);
  if (target?.kind === "goal") {
    return {
      key: "supporterGoal",
      params: { name, title: trimShareTitle(target.title) },
    };
  }
  if (target) {
    return {
      key: "supporterWishlist",
      params: { name, title: trimShareTitle(target.title) },
    };
  }
  return { key: "supporterGeneral", params: { name } };
}
