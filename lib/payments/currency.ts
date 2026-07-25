import { formatMinorAmount as formatMinorAmountLocalized } from "@/lib/i18n/format";

/**
 * Supported currencies and minor-unit helpers.
 *
 * Every amount in the payment domain is an integer in minor units
 * (£5.00 = 500, €5.00 = 500). Floating-point currency maths is forbidden —
 * see .ai/skills/payments.md.
 *
 * All currencies here are 2-decimal, so formatting/parsing can assume 100
 * minor units per major unit. Zero-decimal currencies (JPY, KRW) are
 * intentionally excluded: supporting them needs a per-currency minor-unit
 * exponent through formatMinorAmount and parseMajorAmountToMinor. Which
 * currency a creator settles in is fixed by their country — see
 * lib/payments/countries.ts (ADR-017).
 */

export const SUPPORTED_CURRENCIES = [
  "gbp",
  "eur",
  "usd",
  "cad",
  "aud",
  "nzd",
  "chf",
  "sek",
  "nok",
  "dkk",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(
  value: unknown,
): value is SupportedCurrency {
  return (
    typeof value === "string" &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  );
}

/** True only for a safe integer amount in minor units, e.g. from JSON input. */
export function isValidMinorAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

/**
 * @deprecated Display formatting is locale-aware now — use
 * `formatMinorAmount(amount, currency, locale)` from lib/i18n/format.ts.
 * This two-argument form renders with English (en-GB) conventions and exists
 * only while call sites migrate.
 */
export function formatMinorAmount(
  amount: number,
  currency: SupportedCurrency,
): string {
  return formatMinorAmountLocalized(amount, currency, "en");
}
