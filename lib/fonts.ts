import { Fraunces, Inter } from "next/font/google";
import localFont from "next/font/local";

import type { AppLocale } from "@/i18n/locales";

/**
 * All fonts are self-hosted (ADR-019): no request ever reaches Google at
 * runtime, so no visitor IP is disclosed to Google Fonts. This is a GDPR
 * requirement — the German "Google Fonts" case law: a runtime
 * fonts.googleapis.com / fonts.gstatic.com fetch would leak the visitor's IP
 * to a US third party without consent.
 *
 * Latin faces (Inter body, Fraunces headings) use next/font/google, which
 * downloads the files at build time and serves them from our own origin — the
 * browser never contacts Google. Japanese/Korean use next/font/local against
 * woff2 files committed under app/fonts/ (full japanese/korean subsets from
 * Fontsource): local files mean the build has no dependency on Google either,
 * which keeps builds deterministic and avoids fetching the hundreds of
 * unicode-range slices next/font/google would pull for a CJK family. They are
 * `preload: false` — the @font-face rules are registered but the browser only
 * downloads the files when a CSS rule uses them, which globals.css scopes to
 * `html:lang(ja)` / `html:lang(ko)`. Latin-only pages never fetch them.
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

export const notoSansJp = localFont({
  variable: "--font-noto-jp",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
  src: [
    { path: "../app/fonts/noto-sans-jp-japanese-400.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/noto-sans-jp-japanese-700.woff2", weight: "700", style: "normal" },
  ],
});

export const notoSansKr = localFont({
  variable: "--font-noto-kr",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
  src: [
    { path: "../app/fonts/noto-sans-kr-korean-400.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/noto-sans-kr-korean-700.woff2", weight: "700", style: "normal" },
  ],
});

/**
 * Font CSS-variable classes for the <html> element. Latin faces load on every
 * locale; the CJK variable is added only for ja/ko so its @font-face family is
 * addressable there (globals.css reads `var(--font-noto-jp|kr)`).
 */
export function fontClasses(locale: AppLocale): string {
  const latin = `${inter.variable} ${fraunces.variable}`;
  if (locale === "ja") return `${latin} ${notoSansJp.variable}`;
  if (locale === "ko") return `${latin} ${notoSansKr.variable}`;
  return latin;
}
