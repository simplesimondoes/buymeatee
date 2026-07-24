/**
 * Resolves a creator's single pinned-media URL into how it should render.
 * Pure module (client + server). YouTube and Instagram become hardened,
 * cookie-free embeds; anything else becomes a link card. The output embedUrl
 * is always built from a validated id — the raw input is never interpolated
 * into an iframe src.
 */

export const PINNED_MEDIA_MAX_LENGTH = 500;

export type PinnedMedia =
  | { kind: "youtube"; embedUrl: string; href: string }
  | { kind: "instagram"; embedUrl: string; href: string }
  | { kind: "link"; href: string; host: string };

const YT_ID = /^[\w-]{6,20}$/;
const IG_PATH = /^\/(p|reel|tv)\/([\w-]+)/;

export function resolvePinnedMedia(url: string | null | undefined): PinnedMedia | null {
  if (!url) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = parsed.searchParams.get("v");
    if (v && YT_ID.test(v)) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${v}`,
        href: parsed.href,
      };
    }
  }
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    if (YT_ID.test(id)) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        href: parsed.href,
      };
    }
  }

  if (host === "instagram.com") {
    const match = parsed.pathname.match(IG_PATH);
    if (match) {
      return {
        kind: "instagram",
        embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed`,
        href: parsed.href,
      };
    }
  }

  return { kind: "link", href: parsed.href, host };
}

/** Validation for the form/API: acceptable if it resolves to something. */
export function isValidPinnedMediaUrl(url: string): boolean {
  return url.length <= PINNED_MEDIA_MAX_LENGTH && resolvePinnedMedia(url) !== null;
}
