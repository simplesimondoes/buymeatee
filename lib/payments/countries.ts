import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Countries a creator may onboard a Stripe Connect account from, and the
 * settlement currency Stripe fixes for that country. This is the single
 * source of truth: the allowed-country list, display names, flags and the
 * country → currency mapping all derive from here (see ADR-017).
 *
 * Only 2-decimal currencies are listed. Japan/Korea (JPY/KRW) are deferred
 * because their zero-decimal minor units would need a formatting rework —
 * see lib/payments/currency.ts.
 *
 * Actually onboarding a country also depends on the platform's Stripe account
 * supporting cross-border Connect to it; that is gated operationally by
 * STRIPE_CONNECT_ALLOWED_COUNTRIES (lib/payments/config.ts), not here.
 */

export interface ConnectCountry {
  /** ISO 3166-1 alpha-2, upper case. */
  code: string;
  /** English display name. */
  name: string;
  /** Settlement currency Stripe assigns to accounts in this country. */
  currency: SupportedCurrency;
}

export const CONNECT_COUNTRIES: readonly ConnectCountry[] = [
  { code: "GB", name: "United Kingdom", currency: "gbp" },
  { code: "US", name: "United States", currency: "usd" },
  { code: "CA", name: "Canada", currency: "cad" },
  { code: "AU", name: "Australia", currency: "aud" },
  { code: "NZ", name: "New Zealand", currency: "nzd" },
  { code: "IE", name: "Ireland", currency: "eur" },
  { code: "DE", name: "Germany", currency: "eur" },
  { code: "FR", name: "France", currency: "eur" },
  { code: "ES", name: "Spain", currency: "eur" },
  { code: "IT", name: "Italy", currency: "eur" },
  { code: "NL", name: "Netherlands", currency: "eur" },
  { code: "BE", name: "Belgium", currency: "eur" },
  { code: "AT", name: "Austria", currency: "eur" },
  { code: "PT", name: "Portugal", currency: "eur" },
  { code: "FI", name: "Finland", currency: "eur" },
  { code: "CH", name: "Switzerland", currency: "chf" },
  { code: "SE", name: "Sweden", currency: "sek" },
  { code: "NO", name: "Norway", currency: "nok" },
  { code: "DK", name: "Denmark", currency: "dkk" },
] as const;

const BY_CODE = new Map(CONNECT_COUNTRIES.map((c) => [c.code, c]));

/** Every country code we recognise, upper case. */
export const CONNECT_COUNTRY_CODES: readonly string[] = CONNECT_COUNTRIES.map(
  (c) => c.code,
);

/**
 * Emoji flag for an ISO alpha-2 code (e.g. "GB" → 🇬🇧) by mapping each letter
 * to its regional-indicator symbol. Returns "" for anything not two A–Z
 * letters. Flags render as plain letters on some platforms (notably Windows),
 * so always pair the flag with the country name — never show it alone.
 */
export function countryFlagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    return "";
  }
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (upper.charCodeAt(0) - 65),
    base + (upper.charCodeAt(1) - 65),
  );
}

/** Display name for a code, falling back to the code itself. */
export function countryName(code: string): string {
  return BY_CODE.get(code.toUpperCase())?.name ?? code.toUpperCase();
}

/**
 * The settlement currency for a country. Falls back to "gbp" for unknown
 * codes so callers always get a supported currency.
 */
export function defaultCurrencyForCountry(code: string): SupportedCurrency {
  return BY_CODE.get(code.toUpperCase())?.currency ?? "gbp";
}
