/**
 * Profile settings input validation. Pure module shared by the client
 * (inline errors) and the server (authoritative — the API revalidates
 * everything; the database constraints and RLS are the final layer).
 * Field shapes mirror public.profiles in the foundation migration.
 */

export const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/;
export const DISPLAY_NAME_MAX_LENGTH = 200;
export const BIO_MAX_LENGTH = 1000;
export const COUNTRY_MAX_LENGTH = 200;

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
  country?: string;
}

export type ProfileFieldName = "username" | "displayName" | "bio" | "country";

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

  let country: string | undefined;
  if (typeof input.country === "string" && input.country.trim() !== "") {
    country = input.country.trim();
    if (country.length > COUNTRY_MAX_LENGTH) {
      errors.country = `Keep the country under ${COUNTRY_MAX_LENGTH} characters.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { username, displayName, bio, country },
  };
}
