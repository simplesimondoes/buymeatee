/**
 * Supported currencies and minor-unit helpers.
 *
 * Every amount in the payment domain is an integer in minor units
 * (£5.00 = 500, €5.00 = 500). Floating-point currency maths is forbidden —
 * see .ai/skills/payments.md.
 */

export const SUPPORTED_CURRENCIES = ["gbp", "eur"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(
  value: unknown,
): value is SupportedCurrency {
  return (
    typeof value === "string" &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  );
}

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  gbp: "£",
  eur: "€",
};

/** True only for a safe integer amount in minor units, e.g. from JSON input. */
export function isValidMinorAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

/** Format 500 → "£5.00". Display only — never parse this back into amounts. */
export function formatMinorAmount(
  amount: number,
  currency: SupportedCurrency,
): string {
  if (!Number.isSafeInteger(amount)) {
    throw new Error("Amounts must be integer minor units.");
  }
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  const major = Math.floor(absolute / 100);
  const minor = (absolute % 100).toString().padStart(2, "0");
  return `${sign}${CURRENCY_SYMBOLS[currency]}${major}.${minor}`;
}
