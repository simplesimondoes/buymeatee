import { Fraunces, Inter } from "next/font/google";

import type { AppLocale } from "@/i18n/locales";

/**
 * Latin fonts are self-hosted via next/font. Japanese and Korean use the
 * Google Fonts stylesheet instead (see CjkFontLinks in the locale layout):
 * Noto Sans JP/KR ship as hundreds of unicode-range slices which next/font
 * would download and bundle at build time — the stylesheet approach lets
 * browsers fetch only the slices a page actually renders, and only on
 * ja/ko pages. This is a deliberate, documented exception to self-hosting
 * (ADR-019).
 */
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

/**
 * The locale parameter is currently unused (CJK loads via stylesheet, see
 * above) but kept so per-locale font classes can return without touching
 * call sites.
 */
export function fontClasses(locale: AppLocale): string {
  void locale;
  return `${inter.variable} ${fraunces.variable}`;
}

export const CJK_FONT_STYLESHEETS: Partial<Record<AppLocale, string>> = {
  ja: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap",
  ko: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap",
};
