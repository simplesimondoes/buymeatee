/**
 * Profile settings input validation. Pure module shared by the client
 * (inline errors) and the server (authoritative — the API revalidates
 * everything; the database constraints and RLS are the final layer).
 * Field shapes mirror public.profiles in the foundation migration.
 */

import { isValidPinnedMediaUrl } from "@/lib/profile/pinned-media";

export const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/;
export const DISPLAY_NAME_MAX_LENGTH = 200;
export const BIO_MAX_LENGTH = 1000;
export const ABOUT_MAX_LENGTH = 5000;
export const COUNTRY_MAX_LENGTH = 200;
export const LOCATION_MAX_LENGTH = 120;
export const HOME_CLUB_MAX_LENGTH = 120;
export const SOCIAL_URL_MAX_LENGTH = 300;
/** WHS bounds: plus handicaps are negative; the max index is 54.0. */
export const HANDICAP_MIN = -10;
export const HANDICAP_MAX = 54;
export const HANDEDNESS_VALUES = ["left", "right"] as const;
export type Handedness = (typeof HANDEDNESS_VALUES)[number];

/**
 * Social links are stored as full https URLs. For the three known platforms
 * we also require the host to match, so an Instagram field can't quietly hold
 * a phishing link. `null` host means "any https URL" (the website field).
 */
const SOCIAL_HOSTS: Record<string, readonly string[] | null> = {
  socialYoutube: ["youtube.com", "youtu.be"],
  socialInstagram: ["instagram.com"],
  socialTiktok: ["tiktok.com"],
  socialWebsite: null,
};

function normaliseSocialUrl(
  field: keyof typeof SOCIAL_HOSTS,
  raw: string,
): { ok: true; value: string } | { ok: false } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "https:") {
    return { ok: false };
  }
  if (url.href.length > SOCIAL_URL_MAX_LENGTH) {
    return { ok: false };
  }
  const allowed = SOCIAL_HOSTS[field];
  if (allowed) {
    const host = url.hostname.replace(/^www\./, "");
    if (!allowed.some((h) => host === h || host.endsWith(`.${h}`))) {
      return { ok: false };
    }
  }
  return { ok: true, value: url.href };
}

/**
 * Slugs that would collide with (or shadow) platform routes and identities.
 * A username claims buymeatee.com/t/<username>, but keeping route names out
 * of the namespace also prevents impersonation of platform surfaces.
 */
export const RESERVED_USERNAMES: readonly string[] = [
  "about",
  "account",
  "admin",
  "api",
  "auth",
  "blog",
  "buymeatee",
  "contact",
  "creator",
  "creators",
  "dashboard",
  "discover",
  "early-access",
  "faq",
  "for-creators",
  "for-supporters",
  "gifts",
  "goal",
  "goals",
  "help",
  "home",
  "how-it-works",
  "legal",
  "login",
  "logout",
  "official",
  "privacy",
  "profile",
  "settings",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "sitemap",
  "staff",
  "support",
  "supporter",
  "supporters",
  "team",
  "terms",
  "tee",
  "tees",
];

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.includes(username);
}

export interface ProfileInput {
  username: string;
  displayName: string;
  bio?: string;
  about?: string;
  country?: string;
  handicap?: number;
  location?: string;
  homeClub?: string;
  handedness?: Handedness;
  socialYoutube?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialWebsite?: string;
  pinnedMediaUrl?: string;
}

export type ProfileFieldName =
  | "username"
  | "displayName"
  | "bio"
  | "about"
  | "country"
  | "handicap"
  | "location"
  | "homeClub"
  | "handedness"
  | "socialYoutube"
  | "socialInstagram"
  | "socialTiktok"
  | "socialWebsite"
  | "pinnedMediaUrl";

export type ProfileValidationResult =
  | { ok: true; data: ProfileInput }
  | { ok: false; errors: Partial<Record<ProfileFieldName, string>> };

export const USERNAME_FORMAT_MESSAGE =
  "Use 3–40 lowercase letters, numbers or hyphens (no leading, trailing or only-hyphen names).";

export function validateProfileInput(payload: unknown): ProfileValidationResult {
  const errors: Partial<Record<ProfileFieldName, string>> = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const username =
    typeof input.username === "string"
      ? input.username.trim().toLowerCase()
      : "";
  if (!USERNAME_PATTERN.test(username)) {
    errors.username = USERNAME_FORMAT_MESSAGE;
  } else if (isReservedUsername(username)) {
    errors.username = "That name is reserved. Pick another.";
  }

  const displayName =
    typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (displayName.length < 1 || displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    errors.displayName = `Add the name supporters should see (up to ${DISPLAY_NAME_MAX_LENGTH} characters).`;
  }

  let bio: string | undefined;
  if (typeof input.bio === "string" && input.bio.trim() !== "") {
    bio = input.bio.trim();
    if (bio.length > BIO_MAX_LENGTH) {
      errors.bio = `Keep your bio under ${BIO_MAX_LENGTH} characters.`;
    }
  }

  let about: string | undefined;
  if (typeof input.about === "string" && input.about.trim() !== "") {
    about = input.about.trim();
    if (about.length > ABOUT_MAX_LENGTH) {
      errors.about = `Keep your About section under ${ABOUT_MAX_LENGTH} characters.`;
    }
  }

  let country: string | undefined;
  if (typeof input.country === "string" && input.country.trim() !== "") {
    country = input.country.trim();
    if (country.length > COUNTRY_MAX_LENGTH) {
      errors.country = `Keep the country under ${COUNTRY_MAX_LENGTH} characters.`;
    }
  }

  // Handicap: accepts a number or numeric string; empty clears it.
  let handicap: number | undefined;
  const rawHandicap = input.handicap;
  if (
    rawHandicap !== undefined &&
    rawHandicap !== null &&
    String(rawHandicap).trim() !== ""
  ) {
    const parsed =
      typeof rawHandicap === "number" ? rawHandicap : Number(rawHandicap);
    if (
      !Number.isFinite(parsed) ||
      parsed < HANDICAP_MIN ||
      parsed > HANDICAP_MAX
    ) {
      errors.handicap = `Enter a handicap between ${HANDICAP_MIN} and ${HANDICAP_MAX}.`;
    } else {
      handicap = Math.round(parsed * 10) / 10;
    }
  }

  const location = optionalText(input.location);
  if (location && location.length > LOCATION_MAX_LENGTH) {
    errors.location = `Keep the location under ${LOCATION_MAX_LENGTH} characters.`;
  }

  const homeClub = optionalText(input.homeClub);
  if (homeClub && homeClub.length > HOME_CLUB_MAX_LENGTH) {
    errors.homeClub = `Keep the club name under ${HOME_CLUB_MAX_LENGTH} characters.`;
  }

  let handedness: Handedness | undefined;
  if (typeof input.handedness === "string" && input.handedness.trim() !== "") {
    if ((HANDEDNESS_VALUES as readonly string[]).includes(input.handedness)) {
      handedness = input.handedness as Handedness;
    } else {
      errors.handedness = "Choose left or right.";
    }
  }

  const socials: Record<string, string | undefined> = {};
  const socialFields = [
    "socialYoutube",
    "socialInstagram",
    "socialTiktok",
    "socialWebsite",
  ] as const;
  const socialErrorLabels: Record<(typeof socialFields)[number], string> = {
    socialYoutube: "YouTube",
    socialInstagram: "Instagram",
    socialTiktok: "TikTok",
    socialWebsite: "website",
  };
  for (const field of socialFields) {
    const raw = input[field];
    if (typeof raw === "string" && raw.trim() !== "") {
      const result = normaliseSocialUrl(field, raw);
      if (result.ok) {
        socials[field] = result.value;
      } else {
        errors[field] = `Enter a valid ${socialErrorLabels[field]} link (https://…).`;
      }
    }
  }

  let pinnedMediaUrl: string | undefined;
  const rawPinned = optionalText(input.pinnedMediaUrl);
  if (rawPinned) {
    if (isValidPinnedMediaUrl(rawPinned)) {
      pinnedMediaUrl = rawPinned;
    } else {
      errors.pinnedMediaUrl =
        "Paste a YouTube, Instagram or website link (https://…).";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      username,
      displayName,
      bio,
      about,
      country,
      handicap,
      location,
      homeClub,
      handedness,
      socialYoutube: socials.socialYoutube,
      socialInstagram: socials.socialInstagram,
      socialTiktok: socials.socialTiktok,
      socialWebsite: socials.socialWebsite,
      pinnedMediaUrl,
    },
  };
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}
