import { resolvePinnedMedia } from "@/lib/profile/pinned-media";

import { VIDEO_URL_MAX_LENGTH } from "@/lib/journey/types";

/**
 * A Journey post may carry one optional YouTube video. We reuse the hardened,
 * cookie-free resolver from pinned media (ADR-014): the embed URL is always
 * built from a validated id, never the raw input, and only YouTube is allowed
 * here (Instagram/link cards are a profile-level concept, not a feed embed).
 */

export type JourneyVideo = { embedUrl: string; href: string };

export function resolveJourneyVideo(
  url: string | null | undefined,
): JourneyVideo | null {
  if (!url) {
    return null;
  }
  const media = resolvePinnedMedia(url);
  if (media?.kind !== "youtube") {
    return null;
  }
  return { embedUrl: media.embedUrl, href: media.href };
}

/** Validation for the form/API: acceptable if it resolves to a YouTube embed. */
export function isValidJourneyVideoUrl(url: string): boolean {
  return url.length <= VIDEO_URL_MAX_LENGTH && resolveJourneyVideo(url) !== null;
}
