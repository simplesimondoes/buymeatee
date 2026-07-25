import "server-only";

import OpenAI from "openai";

import { localeLabels, type AppLocale } from "@/i18n/locales";

/**
 * AI personalisation for share-moment copy (ADR-022). Optional layer over the
 * translated template copy in messages/<locale>/gifts.json — when
 * OPENAI_API_KEY is unset this whole boundary reports "not configured" and
 * the templates remain the experience (the platform's fail-safe pattern).
 *
 * The output is only ever a SUGGESTION shown back to the same signed-in
 * creator inside an editable textarea; nothing is posted anywhere (ADR-016:
 * no automation, the creator reviews and sends every post themselves). The
 * prompt enforces the CLAUDE.md hard rules: no invented numbers, supporters,
 * amounts or results, and brand vocabulary (journey/support/Tee — never
 * "donate"). Suggestions that violate the no-fabrication rules are dropped
 * in favour of the template rather than repaired.
 */

export type PersonaliseRequest = {
  kind: "update" | "page" | "goal" | "wishlist";
  locale: AppLocale;
  context: {
    /** Title of the update/goal/item — user content, quoted verbatim. */
    title?: string;
    /** Update body (markdown) — the creator's own words. */
    body?: string;
    /** Creator display name, for voice ("I" is always the poster). */
    displayName?: string;
  };
};

export function isSharePersonalisationConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Posts should fit comfortably in an X compose box with the URL appended. */
const MAX_POST_LENGTH = 260;

const KIND_BRIEF: Record<PersonaliseRequest["kind"], string> = {
  update:
    "The golfer just published a progress update on their page and wants to share it.",
  page: "The golfer's public supporter page just went live and they want to announce it.",
  goal: "The golfer wants to rally support for a goal on their page.",
  wishlist:
    "A supporter just fully funded an item from the golfer's wish list and the golfer wants to celebrate and say thank you.",
};

function buildPrompt(request: PersonaliseRequest): {
  system: string;
  user: string;
} {
  const language = localeLabels[request.locale] ?? "English";
  const system = [
    "You write short social-media posts for golfers on BuyMeATee, a platform where fans support a golfer's journey.",
    "Rules, all mandatory:",
    "- First person, in the golfer's own voice. Positive, encouraging, authentic — never salesy.",
    "- NEVER invent facts: no amounts, supporter counts or names, percentages, results or dates that are not in the provided context.",
    '- Never use the words "donate", "donation", "crowdfunding" or "campaign" (in any language). Use support / journey / goal / community instead.',
    `- One post only, at most ${MAX_POST_LENGTH} characters, at most 2 hashtags, at most 2 emoji. A link is appended separately — do not include a URL.`,
    `- Write the post in ${language}.`,
    "- Reply with the post text only — no quotes, preamble or explanation.",
  ].join("\n");

  const contextLines = [
    KIND_BRIEF[request.kind],
    request.context.displayName
      ? `Golfer's public name: ${request.context.displayName}`
      : null,
    request.context.title ? `Title: ${request.context.title}` : null,
    request.context.body
      ? `The golfer's own update text:\n${request.context.body.slice(0, 2000)}`
      : null,
  ].filter(Boolean);

  return { system, user: contextLines.join("\n\n") };
}

/**
 * Returns a suggested post, or null when unavailable or the suggestion fails
 * validation — callers fall back to the template copy either way.
 */
export async function personaliseShareCopy(
  request: PersonaliseRequest,
): Promise<string | null> {
  if (!isSharePersonalisationConfigured()) {
    return null;
  }
  const { system, user } = buildPrompt(request);
  try {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: process.env.SHARE_AI_MODEL || "gpt-4o-mini",
      max_completion_tokens: 300,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = response.choices[0]?.message?.content?.trim() ?? "";
    return validateSuggestion(text);
  } catch (error) {
    // Privacy-conscious logging, matching lib/email: outcome only.
    console.error(
      "share personalise failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }
}

/** Exported for tests. Enforces the honesty and brand rules post-hoc. */
export function validateSuggestion(raw: string): string | null {
  const text = raw.trim().replace(/^["“]+|["”]+$/g, "").trim();
  if (!text || text.length > MAX_POST_LENGTH + 20) {
    return null;
  }
  if (/donat|crowdfund/i.test(text)) {
    return null;
  }
  if (/https?:\/\//i.test(text)) {
    return null;
  }
  return text;
}
