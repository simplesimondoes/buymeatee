import "server-only";

/**
 * Access gate for the owner analytics dashboard (/admin/analytics).
 *
 * Deliberately NOT the admin_users table: the founder asked for platform
 * performance figures (revenue, commission, growth) to be visible to his
 * owner account only, independent of who else is granted operational admin
 * access. The allow-list is env-overridable so it never needs a code change.
 */

const DEFAULT_ANALYTICS_OWNER_EMAILS = ["simon@chipputtputt.com"];

function allowedEmails(): string[] {
  const raw = process.env.ANALYTICS_OWNER_EMAILS;
  if (!raw) {
    return DEFAULT_ANALYTICS_OWNER_EMAILS;
  }
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True when the verified auth email may see the analytics dashboard.
 * Emails from Supabase Auth are verified (magic-link sign-in), so a plain
 * case-insensitive match is a real identity check, not a client hint.
 */
export function canViewAnalytics(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return allowedEmails().includes(email.trim().toLowerCase());
}
