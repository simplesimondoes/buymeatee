import { intlLocale, type AppLocale } from "@/i18n/locales";
import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Locale-aware display formatting (ADR-019). Pure — no request context, no
 * server-only imports — so it is equally usable from server components,
 * client components, emails, OG images, scripts and tests. Callers pass the
 * locale explicitly; UI code can read it from useLocale()/getLocale().
 *
 * Amounts remain canonical integers in minor units everywhere (see
 * .ai/skills/payments.md); localisation is display-only.
 */

/**
 * Format an integer minor-unit amount as localized currency.
 * 500 gbp → "£5.00" (en), "5,00 £" (fr), "5,00 £" (de).
 * All supported currencies are 2-decimal (JPY/KRW deliberately excluded).
 */
export function formatMinorAmount(
  amount: number,
  currency: SupportedCurrency,
  locale: AppLocale,
  options?: {
    /** Drop the decimals when the amount is a whole number (e.g. "£500"). */
    trimWholeAmounts?: boolean;
  },
): string {
  if (!Number.isSafeInteger(amount)) {
    throw new Error("Amounts must be integer minor units.");
  }
  const trim = options?.trimWholeAmounts === true && amount % 100 === 0;
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: currency.toUpperCase(),
    ...(trim ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(amount / 100);
}

/** Format a date for display, defaulting to a medium date (e.g. "24 July 2026"). */
export function formatDate(
  value: string | Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(intlLocale[locale], options).format(date);
}

/** Format a date with time (e.g. admin/dashboard timestamps). */
export function formatDateTime(
  value: string | Date,
  locale: AppLocale,
): string {
  return formatDate(value, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

/** "3 days ago" / "vor 3 Tagen" — relative to `now` (defaults to Date.now()). */
export function formatRelativeTime(
  value: string | Date,
  locale: AppLocale,
  now: Date = new Date(),
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = date.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], {
    numeric: "auto",
  });
  for (const [unit, ms] of RELATIVE_STEPS) {
    if (Math.abs(diff) >= ms) {
      return rtf.format(Math.trunc(diff / ms), unit);
    }
  }
  return rtf.format(Math.trunc(diff / (1000 * 60)), "minute");
}

/** Locale-formatted plain number (grouping separators). */
export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(value);
}

/** Locale-formatted percentage from a 0–100 value: 45 → "45%" / "45 %". */
export function formatPercent(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

/**
 * Signed percentage for period-on-period deltas: 8.34 → "+8.3%", -50 → "-50%".
 * One decimal keeps small movements visible without false precision.
 */
export function formatSignedPercent(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    signDisplay: "exceptZero",
    maximumFractionDigits: 1,
  }).format(value / 100);
}
