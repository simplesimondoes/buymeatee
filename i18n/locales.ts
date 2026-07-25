/**
 * Locale registry — the single source of truth for supported languages.
 * Pure and dependency-free so it can be imported from schemas, emails,
 * scripts and client code alike.
 *
 * Adding a language (e.g. pt-BR) means: add it here, create
 * messages/<locale>/ with the full namespace set, and translate.
 * Nothing else needs restructuring.
 */

export const locales = [
  "en",
  "de",
  "fr",
  "es",
  "it",
  "ja",
  "ko",
  "pt",
] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

/** Native-language labels for the language selector. Never flags-only. */
export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
};

/** Value for the <html lang> attribute. English keeps the en-GB brand voice. */
export const htmlLang: Record<AppLocale, string> = {
  en: "en-GB",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  ja: "ja",
  ko: "ko",
  pt: "pt",
};

/** Open Graph og:locale values. */
export const ogLocale: Record<AppLocale, string> = {
  en: "en_GB",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  it: "it_IT",
  ja: "ja_JP",
  ko: "ko_KR",
  pt: "pt_PT",
};

/**
 * BCP 47 tags for Intl.* formatting APIs. English uses en-GB so dates and
 * currency keep their current UK presentation.
 */
export const intlLocale: Record<AppLocale, string> = {
  en: "en-GB",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  pt: "pt-PT",
};
