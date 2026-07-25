import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locales";

/**
 * Locale routing configuration (ADR-019).
 *
 * - `localePrefix: "always"`: every page URL carries its locale (/en, /de, …).
 *   There are no unprefixed page duplicates; legacy unprefixed URLs are
 *   redirected by proxy.ts.
 * - Detection order for unprefixed requests: NEXT_LOCALE cookie →
 *   Accept-Language → en. The URL is always authoritative once present.
 * - The cookie is extended to a year so an explicit choice persists for
 *   anonymous visitors (next-intl's default is a session cookie).
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
});
