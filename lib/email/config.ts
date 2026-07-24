import "server-only";

/**
 * Email provider configuration (Resend).
 *
 * Like the Stripe and Supabase boundaries, email is optional and fails
 * safely: with no key or sender configured, callers report an honest
 * "not-configured" outcome and nothing is ever faked. Secrets live only in
 * server-side env vars — never in the browser bundle or source control.
 */

export type EmailConfig = {
  apiKey: string;
  /** RFC 5322 sender, e.g. "BuyMeATee <notifications@buymeatee.com>". */
  from: string;
  /** Optional Reply-To; falls back to `from` when unset. */
  replyTo?: string;
};

export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return null;
  }
  const replyTo = process.env.EMAIL_REPLY_TO;
  return { apiKey, from, ...(replyTo ? { replyTo } : {}) };
}

export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}
