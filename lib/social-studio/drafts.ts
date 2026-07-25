import "server-only";

import { planCalendar, type SlotPlan } from "@/lib/social-studio/calendar";
import { generateDraft } from "@/lib/social-studio/generate";
import type {
  SocialDraftRow,
  SocialStatus,
} from "@/lib/social-studio/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Data access for the Social Content Studio (ADR-023). Everything here runs
 * with the service-role client behind the owner-gated admin routes — the
 * table has no client grants at all.
 */

const TABLE = "social_drafts";

/** Drafts from the start of today onward, plus any unpublished stragglers. */
export async function listDrafts(): Promise<SocialDraftRow[]> {
  const supabase = getSupabaseAdminClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(
      `scheduled_for.gte.${todayStart.toISOString()},status.neq.published`,
    )
    .order("scheduled_for", { ascending: true });
  if (error) {
    throw new Error(`social drafts unavailable: ${error.message}`);
  }
  return (data ?? []) as SocialDraftRow[];
}

export async function getDraft(id: string): Promise<SocialDraftRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`social draft unavailable: ${error.message}`);
  }
  return (data as SocialDraftRow) ?? null;
}

export async function updateDraft(
  id: string,
  patch: Partial<SocialDraftRow>,
): Promise<SocialDraftRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new Error(`social draft update failed: ${error.message}`);
  }
  return (data as SocialDraftRow) ?? null;
}

export async function insertDraft(
  row: Omit<SocialDraftRow, "id" | "created_at" | "updated_at">,
): Promise<SocialDraftRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new Error(`social draft insert failed: ${error.message}`);
  }
  return (data as SocialDraftRow) ?? null;
}

export type SeedResult = {
  created: number;
  skippedExisting: number;
  failedGeneration: number;
};

/**
 * Plans the given window and generates drafts for every slot that doesn't
 * already have one (same day + slot), so re-running is safe and the calendar
 * stays rolling. Generation runs a few slots at a time; a slot whose
 * generation fails is counted honestly and simply retried on the next seed
 * call — no placeholder content is ever written.
 */
export async function seedCalendar({
  from,
  days,
}: {
  from: Date;
  days: number;
}): Promise<SeedResult> {
  const supabase = getSupabaseAdminClient();
  const plans = planCalendar({ from, days });
  const windowStart = plans[0].scheduledFor;
  const windowEnd = new Date(
    new Date(plans[plans.length - 1].scheduledFor).getTime() + 24 * 3600 * 1000,
  ).toISOString();

  const { data: existing, error } = await supabase
    .from(TABLE)
    .select("scheduled_for, slot")
    .gte("scheduled_for", windowStart)
    .lt("scheduled_for", windowEnd);
  if (error) {
    throw new Error(`social drafts unavailable: ${error.message}`);
  }
  const taken = new Set(
    (existing ?? []).map(
      (row) => `${String(row.scheduled_for).slice(0, 10)}:${row.slot}`,
    ),
  );
  const missing = plans.filter(
    (plan) => !taken.has(`${plan.scheduledFor.slice(0, 10)}:${plan.slot}`),
  );

  const result: SeedResult = {
    created: 0,
    skippedExisting: plans.length - missing.length,
    failedGeneration: 0,
  };

  const CONCURRENCY = 4;
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY);
    const generated = await Promise.all(
      batch.map(async (plan) => ({ plan, content: await generateDraft(plan) })),
    );
    for (const { plan, content } of generated) {
      if (!content) {
        result.failedGeneration += 1;
        continue;
      }
      await insertDraft(draftFromPlan(plan, content));
      result.created += 1;
    }
  }
  return result;
}

function draftFromPlan(
  plan: SlotPlan,
  content: NonNullable<Awaited<ReturnType<typeof generateDraft>>>,
): Omit<SocialDraftRow, "id" | "created_at" | "updated_at"> {
  return {
    scheduled_for: plan.scheduledFor,
    slot: plan.slot,
    pillar: plan.pillar,
    audience: plan.audience,
    objective: content.objective,
    cta: content.cta,
    image_type: content.imageType,
    image_prompt: content.imagePrompt,
    branded_text: content.brandedText,
    x_copy: content.xCopy,
    bluesky_copy: content.blueskyCopy,
    networks: ["x", "bluesky"],
    status: "ai_generated" as SocialStatus,
    published_at: null,
  };
}

/** Duplicate lands one week later as an editable copy — never pre-approved. */
export async function duplicateDraft(
  source: SocialDraftRow,
): Promise<SocialDraftRow | null> {
  const scheduled = new Date(source.scheduled_for);
  scheduled.setUTCDate(scheduled.getUTCDate() + 7);
  return insertDraft({
    scheduled_for: scheduled.toISOString(),
    slot: source.slot,
    pillar: source.pillar,
    audience: source.audience,
    objective: source.objective,
    cta: source.cta,
    image_type: source.image_type,
    image_prompt: source.image_prompt,
    branded_text: source.branded_text,
    x_copy: source.x_copy,
    bluesky_copy: source.bluesky_copy,
    networks: source.networks,
    status: "edited",
    published_at: null,
  });
}
