import "server-only";

import type { SupportedCurrency } from "@/lib/payments/currency";
import type { FeeConfig } from "@/lib/payments/fees";

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
    paymentFeeFixed: {
      gbp: readIntegerEnv("STRIPE_PAYMENT_FEE_FIXED_GBP", 20),
      eur: readIntegerEnv("STRIPE_PAYMENT_FEE_FIXED_EUR", 25),
    },
    minimumGift: {
      gbp: readIntegerEnv("STRIPE_MINIMUM_GIFT_GBP", 100),
      eur: readIntegerEnv("STRIPE_MINIMUM_GIFT_EUR", 100),
    },
    maximumGift: {
      gbp: readIntegerEnv("STRIPE_MAXIMUM_GIFT_GBP", 50_000),
      eur: readIntegerEnv("STRIPE_MAXIMUM_GIFT_EUR", 50_000),
    },
  };
}

/** Suggested gift amounts shown in the composer, minor units per currency. */
export const PRESET_GIFT_AMOUNTS: Record<SupportedCurrency, number[]> = {
  gbp: [300, 500, 1000, 2500],
  eur: [300, 500, 1000, 2500],
};

/**
 * Countries a recipient may onboard from (ISO 3166-1 alpha-2). GBP/EUR only
 * for the MVP, so the default list covers the UK and euro-area countries
 * Stripe Connect commonly supports.
 */
export function getAllowedConnectCountries(): string[] {
  const raw = process.env.STRIPE_CONNECT_ALLOWED_COUNTRIES;
  const list = (raw?.trim() ? raw.split(",") : ["GB", "IE", "DE", "FR", "ES", "NL", "BE", "AT", "PT", "FI"])
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => /^[A-Z]{2}$/.test(entry));
  if (list.length === 0) {
    throw new Error("STRIPE_CONNECT_ALLOWED_COUNTRIES resolved to an empty list.");
  }
  return list;
}

export function defaultCurrencyForCountry(country: string): SupportedCurrency {
  return country === "GB" ? "gbp" : "eur";
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
    // {GIFT_PUBLIC_ID} is replaced per checkout session.
    checkoutSuccessUrl: readSameOriginUrlEnv(
      "STRIPE_CHECKOUT_SUCCESS_URL",
      "/gifts/{GIFT_PUBLIC_ID}/thanks",
    ),
    checkoutCancelUrl: readSameOriginUrlEnv(
      "STRIPE_CHECKOUT_CANCEL_URL",
      "/gifts/{GIFT_PUBLIC_ID}/cancelled",
    ),
  };
}
