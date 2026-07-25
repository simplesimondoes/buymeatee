import "server-only";

import {
  CONNECT_COUNTRY_CODES,
  defaultCurrencyForCountry,
} from "@/lib/payments/countries";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import type { FeeConfig } from "@/lib/payments/fees";

// Re-exported so callers that reach for currency-by-country keep a single
// import surface; the mapping itself lives in lib/payments/countries.ts.
export { defaultCurrencyForCountry };

/**
 * Server-side payment configuration, read from environment variables with
 * documented commercial defaults. One module owns every tunable so pricing
 * changes never touch UI components. See .env.example for the variable list.
 */

/** Bump whenever the pricing assumptions change; stored on every gift. */
const FEE_MODEL_VERSION = "2026-07-v1";

function readIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || String(parsed) !== raw.trim()) {
    throw new Error(
      `Invalid ${name}: expected a non-negative integer, got "${raw}".`,
    );
  }
  return parsed;
}

/**
 * Parse a decimal percentage like "1.5" into basis points (150) using string
 * arithmetic — no floating point anywhere near money.
 */
function readPercentEnvAsBps(name: string, fallbackBps: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallbackBps;
  }
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(raw);
  if (!match) {
    throw new Error(
      `Invalid ${name}: expected a percentage like "1.5" (max 2 decimals), got "${raw}".`,
    );
  }
  const whole = Number.parseInt(match[1], 10);
  const fraction = Number.parseInt((match[2] ?? "").padEnd(2, "0") || "0", 10);
  return whole * 100 + fraction;
}

/**
 * Per-currency commercial defaults (minor units). Every supported currency
 * needs an entry. The "kr" currencies (SEK/NOK/DKK) trade ~10:1 against
 * GBP/EUR, so their fixed fee, minimum and maximum are scaled accordingly.
 * Each is overridable with STRIPE_<NAME>_<CUR> (e.g. STRIPE_MINIMUM_GIFT_SEK).
 */
const PAYMENT_FEE_FIXED_DEFAULTS: Record<SupportedCurrency, number> = {
  gbp: 20,
  eur: 25,
  usd: 30,
  cad: 30,
  aud: 30,
  nzd: 30,
  chf: 30,
  sek: 180,
  nok: 180,
  dkk: 180,
};

const MINIMUM_GIFT_DEFAULTS: Record<SupportedCurrency, number> = {
  gbp: 100,
  eur: 100,
  usd: 100,
  cad: 100,
  aud: 100,
  nzd: 100,
  chf: 100,
  sek: 1000,
  nok: 1000,
  dkk: 1000,
};

const MAXIMUM_GIFT_DEFAULTS: Record<SupportedCurrency, number> = {
  gbp: 50_000,
  eur: 50_000,
  usd: 50_000,
  cad: 50_000,
  aud: 50_000,
  nzd: 50_000,
  chf: 50_000,
  sek: 500_000,
  nok: 500_000,
  dkk: 500_000,
};

/**
 * Build a per-currency amount record, reading STRIPE_<name>_<CUR> for each
 * currency and falling back to the documented default.
 */
function readCurrencyAmounts(
  envPrefix: string,
  defaults: Record<SupportedCurrency, number>,
): Record<SupportedCurrency, number> {
  return Object.fromEntries(
    SUPPORTED_CURRENCIES.map((currency) => [
      currency,
      readIntegerEnv(
        `${envPrefix}_${currency.toUpperCase()}`,
        defaults[currency],
      ),
    ]),
  ) as Record<SupportedCurrency, number>;
}

export function getFeeConfig(): FeeConfig {
  const platformFeeBps = readIntegerEnv("STRIPE_PLATFORM_FEE_BPS", 500);
  const paymentFeeBps = readPercentEnvAsBps("STRIPE_PAYMENT_FEE_PERCENT", 150);
  if (platformFeeBps >= 10_000 || paymentFeeBps >= 10_000) {
    throw new Error("Fee rates must be below 100%.");
  }
  return {
    feeModelVersion: FEE_MODEL_VERSION,
    platformFeeBps,
    paymentFeeBps,
    paymentFeeFixed: readCurrencyAmounts(
      "STRIPE_PAYMENT_FEE_FIXED",
      PAYMENT_FEE_FIXED_DEFAULTS,
    ),
    minimumGift: readCurrencyAmounts("STRIPE_MINIMUM_GIFT", MINIMUM_GIFT_DEFAULTS),
    maximumGift: readCurrencyAmounts("STRIPE_MAXIMUM_GIFT", MAXIMUM_GIFT_DEFAULTS),
  };
}

const STANDARD_PRESETS = [300, 500, 1000, 2500];
const KRONA_PRESETS = [3000, 5000, 10000, 25000];

/** Suggested gift amounts shown in the composer, minor units per currency. */
export const PRESET_GIFT_AMOUNTS: Record<SupportedCurrency, number[]> = {
  gbp: STANDARD_PRESETS,
  eur: STANDARD_PRESETS,
  usd: STANDARD_PRESETS,
  cad: STANDARD_PRESETS,
  aud: STANDARD_PRESETS,
  nzd: STANDARD_PRESETS,
  chf: STANDARD_PRESETS,
  sek: KRONA_PRESETS,
  nok: KRONA_PRESETS,
  dkk: KRONA_PRESETS,
};

/**
 * Countries a recipient may onboard from (ISO 3166-1 alpha-2). Defaults to the
 * full set we support (lib/payments/countries.ts); override with
 * STRIPE_CONNECT_ALLOWED_COUNTRIES to gate onboarding to the subset the
 * platform's Stripe account actually supports cross-border Connect for.
 */
export function getAllowedConnectCountries(): string[] {
  const raw = process.env.STRIPE_CONNECT_ALLOWED_COUNTRIES;
  const list = (raw?.trim() ? raw.split(",") : [...CONNECT_COUNTRY_CODES])
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => /^[A-Z]{2}$/.test(entry));
  if (list.length === 0) {
    throw new Error("STRIPE_CONNECT_ALLOWED_COUNTRIES resolved to an empty list.");
  }
  return list;
}

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://buymeatee.com").replace(
    /\/$/,
    "",
  );
}

/**
 * Return/refresh/success/cancel URLs. Only same-origin URLs are accepted from
 * the environment — never request input — which rules out open redirects.
 */
function readSameOriginUrlEnv(name: string, fallbackPath: string): string {
  const origin = siteOrigin();
  const raw = process.env[name]?.trim();
  if (!raw) {
    return `${origin}${fallbackPath}`;
  }
  if (!raw.startsWith(`${origin}/`)) {
    throw new Error(`Invalid ${name}: must start with ${origin}/.`);
  }
  return raw;
}

export function getStripeUrls() {
  return {
    connectReturnUrl: readSameOriginUrlEnv(
      "STRIPE_CONNECT_RETURN_URL",
      "/settings/payments/return",
    ),
    connectRefreshUrl: readSameOriginUrlEnv(
      "STRIPE_CONNECT_REFRESH_URL",
      "/api/connect/refresh",
    ),
    // {GIFT_PUBLIC_ID} and {LOCALE} are replaced per checkout session, so
    // supporters return to the confirmation page in their own language.
    checkoutSuccessUrl: readSameOriginUrlEnv(
      "STRIPE_CHECKOUT_SUCCESS_URL",
      "/{LOCALE}/gifts/{GIFT_PUBLIC_ID}/thanks",
    ),
    checkoutCancelUrl: readSameOriginUrlEnv(
      "STRIPE_CHECKOUT_CANCEL_URL",
      "/{LOCALE}/gifts/{GIFT_PUBLIC_ID}/cancelled",
    ),
  };
}
