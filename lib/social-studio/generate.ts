import "server-only";

import OpenAI from "openai";

import { audiences } from "@/lib/content/audiences";
import type { SlotPlan } from "@/lib/social-studio/calendar";
import type { SocialImageType } from "@/lib/social-studio/types";

/**
 * AI draft generation for the Social Content Studio (ADR-023). Shares the
 * OPENAI_API_KEY / SHARE_AI_MODEL configuration with share-moment
 * personalisation (lib/share/personalise.ts) and the same fail-safe rule:
 * unconfigured means an honest "unavailable", never fabricated content.
 *
 * Phase 1 generates image PROMPTS only. Future image generation should slot
 * in behind `GeneratedDraft.imagePrompt` via the OpenAI Images API without
 * touching the content model — see generateDraftImage() at the bottom.
 */

export type GeneratedDraft = {
  objective: string;
  cta: string;
  imageType: SocialImageType;
  imagePrompt: string | null;
  brandedText: string | null;
  xCopy: string;
  blueskyCopy: string;
};

export function isSocialStudioConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

const X_MAX = 280;
const BLUESKY_MAX = 300;

const PILLAR_BRIEFS: Record<string, string> = {
  golfGoals:
    "Golf goals — ask the audience about their own golfing ambitions (their biggest goal this season, what is stopping them, which tournament they dream of playing). Conversation over broadcast.",
  audienceSpotlights:
    "Audience spotlight — speak to one specific kind of golfer and explain concretely how BuyMeATee supports their journey.",
  golfJourney:
    "The golf journey — progress, practice, coaching, improvement and ambition. Celebrate the grind of getting better.",
  founderUpdates:
    "Founder update — building BuyMeATee in public: a feature shipped, design decisions, the eight languages, lessons learned. Honest and specific; write as the founder.",
  educational:
    "Educational — practical help: how to build a great support page, explain a goal clearly, keep supporters engaged, document a journey.",
  brandMission:
    "Brand mission — reinforce \"For Golfers With a Goal.\" from a fresh angle each time, without repeating previous framings.",
};

function buildPrompt(plan: SlotPlan): { system: string; user: string } {
  const system = [
    "You write social-media drafts for BuyMeATee, the platform For Golfers With a Goal — golfers raise support for concrete goals from the people around their golf.",
    "Voice: optimistic, friendly, authentic, ambitious, golf-focused, helpful. Vocabulary: support, journey, goal, progress, ambition, community.",
    "Hard rules, all mandatory:",
    "- The platform is NEW with very few users. NEVER claim traction, user counts, testimonials, community milestones or success stories. No invented people or quotes. Inspire and explain the mission instead.",
    '- Never use "donate", "donation", "crowdfunding", "campaign", begging, pressure or fake urgency.',
    "- At most 1 hashtag, usually none. At most 1 emoji.",
    "- Do not include URLs — a link may be added by hand.",
    "- Write the exact brand name BuyMeATee when naming the product (not on every post — mission and question posts often work better without it).",
    "",
    "Produce one post in two platform versions plus a brief. Reply with ONLY a JSON object:",
    "{",
    '  "objective": string,          // one sentence: what this post is trying to achieve',
    '  "cta": string,                // the action we hope a reader takes (may be "reply with ..." or "none")',
    '  "imageType": "none" | "branded" | "lifestyle",',
    '  "imagePrompt": string | null, // lifestyle only: an editorial golf photo prompt — authentic, premium, cinematic, natural light, no text, no logos',
    '  "brandedText": string | null, // branded only: a short line for a branded graphic, e.g. "For Golfers With a Goal."',
    `  "xCopy": string,              // for X: engaging, short, natural, one clear idea, under ${X_MAX} characters`,
    `  "blueskyCopy": string         // for Bluesky: slightly more conversational, never a duplicate of xCopy, under ${BLUESKY_MAX} characters`,
    "}",
  ].join("\n");

  const audience = plan.audience
    ? audiences.find((entry) => entry.slug === plan.audience)
    : undefined;
  const user = [
    `Content pillar: ${PILLAR_BRIEFS[plan.pillar] ?? plan.pillar}`,
    plan.slot === "morning"
      ? "Slot: morning — purpose is to generate conversation (questions, polls, opinions). These usually need no image (imageType \"none\")."
      : "Slot: afternoon — purpose is to provide value (tips, features, founder updates, spotlights, inspiration). An image often helps: choose \"branded\" for mission and feature posts, and choose \"lifestyle\" for audience spotlights, journey and inspiration posts (an authentic editorial golf photo beats a graphic there).",
    audience
      ? `Spotlight audience: ${audience.slug.replace(/-/g, " ")} (their landing page is buymeatee.com/for/${audience.slug} — do not include the URL, just speak to them).`
      : null,
    `Planned date: ${plan.scheduledFor.slice(0, 10)}.`,
    "Vary style and CTA versus typical posts on this pillar — avoid formulaic openers.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

/**
 * Generates one draft. Returns null when unconfigured or when the model's
 * output fails validation — callers surface an honest failure, never a
 * half-checked post.
 */
export async function generateDraft(
  plan: SlotPlan,
): Promise<GeneratedDraft | null> {
  if (!isSocialStudioConfigured()) {
    return null;
  }
  const { system, user } = buildPrompt(plan);
  try {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: process.env.SHARE_AI_MODEL || "gpt-4o-mini",
      max_completion_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    return validateGeneratedDraft(raw);
  } catch (error) {
    console.error(
      "social studio generation failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }
}

/** Exported for tests. Parses and enforces the honesty/format rules. */
export function validateGeneratedDraft(raw: string): GeneratedDraft | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const text = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

  const xCopy = text(parsed.xCopy);
  const blueskyCopy = text(parsed.blueskyCopy);
  const imageType = text(parsed.imageType) as SocialImageType;
  if (!xCopy || !blueskyCopy || xCopy === blueskyCopy) {
    return null;
  }
  if (xCopy.length > X_MAX || blueskyCopy.length > BLUESKY_MAX) {
    return null;
  }
  if (!["none", "branded", "lifestyle"].includes(imageType)) {
    return null;
  }
  // Brand/honesty tripwires — same vocabulary rules as lib/share.
  const banned = /donat|crowdfund|campaign/i;
  if (banned.test(xCopy) || banned.test(blueskyCopy)) {
    return null;
  }
  if (/https?:\/\//i.test(xCopy) || /https?:\/\//i.test(blueskyCopy)) {
    return null;
  }

  return {
    objective: text(parsed.objective).slice(0, 300),
    cta: text(parsed.cta).slice(0, 200),
    imageType,
    imagePrompt:
      imageType === "lifestyle" ? text(parsed.imagePrompt).slice(0, 600) || null : null,
    brandedText:
      imageType === "branded" ? text(parsed.brandedText).slice(0, 120) || null : null,
    xCopy,
    blueskyCopy,
  };
}

/**
 * EXTENSION POINT (future phase): generate an actual image for a draft via
 * the OpenAI Images API from `imagePrompt` / `brandedText`. Deliberately
 * unimplemented in Phase 1 — the content model already carries everything an
 * image pipeline needs, so adding this must not change the schema.
 */
export async function generateDraftImage(): Promise<null> {
  return null;
}
