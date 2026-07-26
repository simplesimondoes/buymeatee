import "server-only";

import { createTranslator } from "next-intl";

import { loadMessages } from "@/i18n/load-messages";
import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/locales";
import { milestonesCrossed } from "@/lib/journey/milestone";
import type { MilestonePercent } from "@/lib/journey/types";
import { logPaymentEvent } from "@/lib/payments/log";
import type { GiftRow } from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only writer for automatic Journey milestone posts (Phase 2). Called
 * exclusively from the verified Stripe webhook path (lib/payments/webhooks.ts),
 * behind the exactly-once paid transition — so a milestone can never be
 * client-invented, and replays can't duplicate it (the partial unique index on
 * (milestone_goal_id, milestone_percent) makes the insert idempotent).
 *
 * Every milestone post is created as a DRAFT (ADR-016 / ADR-022: never
 * auto-published). The creator reviews the AI-honest suggested copy, may
 * personalise it, then publishes it themselves.
 */

async function getJourneyTranslator(locale: AppLocale) {
  const messages = await loadMessages(locale);
  return createTranslator({ locale, messages, namespace: "journey" });
}

/**
 * Create the milestone drafts for whatever thresholds THIS gift crossed. The
 * before/after arithmetic mirrors enqueueGoalReachedNotification: the goal's
 * raised_amount already reflects this gift, so raisedBefore subtracts it back.
 */
export async function createGoalMilestoneDrafts(
  gift: Pick<GiftRow, "id" | "goal_id" | "gift_amount">,
): Promise<void> {
  if (!gift.goal_id) {
    return;
  }
  const supabase = getSupabaseAdminClient();

  const { data: goal, error: loadError } = await supabase
    .from("creator_goals")
    .select("creator_id, title, target_amount, raised_amount")
    .eq("id", gift.goal_id)
    .maybeSingle();
  if (loadError || !goal) {
    if (loadError) {
      logPaymentEvent("error", "journey.milestone_goal_load_failed", {
        gift_id: gift.id,
        goal_id: gift.goal_id,
        reason: loadError.message,
      });
    }
    return;
  }

  const raisedAfter = goal.raised_amount as number;
  const raisedBefore = raisedAfter - gift.gift_amount;
  const crossed = milestonesCrossed(
    raisedBefore,
    raisedAfter,
    goal.target_amount as number,
  );
  if (crossed.length === 0) {
    return;
  }

  const { data: creator } = await supabase
    .from("profiles")
    .select("preferred_locale")
    .eq("id", goal.creator_id as string)
    .maybeSingle();
  const locale = isAppLocale(creator?.preferred_locale)
    ? creator.preferred_locale
    : defaultLocale;
  const t = await getJourneyTranslator(locale);
  const goalTitle = goal.title as string;

  for (const percent of crossed) {
    await insertMilestoneDraft(
      goal.creator_id as string,
      gift.goal_id,
      percent,
      {
        title: t("milestoneDraft.title", { percent }),
        body: t("milestoneDraft.body", { percent, goalTitle }),
        label: t("milestoneDraft.label", { percent }),
      },
    );
  }
}

/**
 * Seed a DRAFT "new goal" Journey post when a creator creates a goal (ADR-022
 * / spec #12). Owner-initiated, best-effort, never auto-published. Uses the
 * service-role client for a single trusted insert; the creator edits/publishes
 * from their dashboard.
 */
export async function createGoalCreatedDraft(
  creatorId: string,
  goalId: string,
  goalTitle: string,
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: creator } = await supabase
      .from("profiles")
      .select("preferred_locale")
      .eq("id", creatorId)
      .maybeSingle();
    const locale = isAppLocale(creator?.preferred_locale)
      ? creator.preferred_locale
      : defaultLocale;
    const t = await getJourneyTranslator(locale);
    await supabase.from("journey_posts").insert({
      creator_id: creatorId,
      kind: "update",
      status: "draft",
      title: t("goalCreatedDraft.title", { goalTitle }),
      body: t("goalCreatedDraft.body", { goalTitle }),
      goal_id: goalId,
    });
  } catch {
    // A missing draft is never worth failing goal creation over.
  }
}

async function insertMilestoneDraft(
  creatorId: string,
  goalId: string,
  percent: MilestonePercent,
  copy: { title: string; body: string; label: string },
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("journey_posts").insert({
    creator_id: creatorId,
    kind: "milestone",
    status: "draft",
    title: copy.title,
    body: copy.body,
    milestone_label: copy.label,
    goal_id: goalId,
    milestone_goal_id: goalId,
    milestone_percent: percent,
  });
  // 23505 = the milestone draft already exists (webhook replay). Not an error.
  if (error && error.code !== "23505") {
    logPaymentEvent("error", "journey.milestone_draft_failed", {
      goal_id: goalId,
      milestone_percent: percent,
      reason: error.message,
    });
  }
}
