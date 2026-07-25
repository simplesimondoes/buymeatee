/**
 * Social Content Studio (ADR-023) — shared vocabulary.
 *
 * Pure constants and row types so both server code and the admin UI agree on
 * pillars, slots, image kinds and the status workflow. The post copy itself
 * is founder-authored English content stored in the row (never localised);
 * only the studio chrome is translated.
 */

export const SOCIAL_PILLARS = [
  "golfGoals",
  "audienceSpotlights",
  "golfJourney",
  "founderUpdates",
  "educational",
  "brandMission",
] as const;
export type SocialPillar = (typeof SOCIAL_PILLARS)[number];

export const SOCIAL_SLOTS = ["morning", "afternoon"] as const;
export type SocialSlot = (typeof SOCIAL_SLOTS)[number];

export const SOCIAL_IMAGE_TYPES = ["none", "branded", "lifestyle"] as const;
export type SocialImageType = (typeof SOCIAL_IMAGE_TYPES)[number];

export const SOCIAL_STATUSES = [
  "draft",
  "ai_generated",
  "edited",
  "approved",
  "published",
] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];

export const SOCIAL_NETWORKS = ["x", "bluesky"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export type SocialDraftRow = {
  id: string;
  scheduled_for: string;
  slot: SocialSlot;
  pillar: SocialPillar;
  audience: string | null;
  objective: string;
  cta: string;
  image_type: SocialImageType;
  image_prompt: string | null;
  branded_text: string | null;
  x_copy: string;
  bluesky_copy: string;
  networks: SocialNetwork[];
  status: SocialStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Which statuses each action may start from. The workflow is
 * draft → ai_generated → edited → approved → published; editing after
 * approval honestly drops back to `edited` so nothing published-looking is
 * silently rewritten.
 */
export const SOCIAL_ACTION_FROM: Record<
  "edit" | "regenerate" | "approve" | "publish",
  readonly SocialStatus[]
> = {
  edit: ["draft", "ai_generated", "edited", "approved"],
  regenerate: ["draft", "ai_generated", "edited", "approved"],
  approve: ["ai_generated", "edited"],
  publish: ["approved"],
};

export function canPerform(
  action: keyof typeof SOCIAL_ACTION_FROM,
  status: SocialStatus,
): boolean {
  return SOCIAL_ACTION_FROM[action].includes(status);
}
