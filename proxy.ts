import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { locales } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

/**
 * Composed proxy (ADR-019):
 *
 * 1. API + auth route handlers: Supabase session refresh only (unchanged
 *    behaviour) — these are never locale-prefixed.
 * 2. All page routes: next-intl locale handling — redirects unprefixed URLs
 *    to the visitor's locale (URL → NEXT_LOCALE cookie → Accept-Language →
 *    en; 307, deliberately not cacheable since the target is per-visitor)
 *    and maintains the locale cookie.
 * 3. Supabase session refresh additionally runs for authed page areas only
 *    (dashboard, settings, admin, sign-in). Marketing pages never trigger a
 *    Supabase round-trip, so they stay served straight from the static cache.
 */

const handleIntl = createIntlMiddleware(routing);

const AUTHED_PAGE_PREFIXES = ["/dashboard", "/settings", "/admin", "/sign-in"];

const LOCALE_PREFIX_PATTERN = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

function isAuthedPagePath(pathname: string): boolean {
  const withoutLocale = pathname.replace(LOCALE_PREFIX_PATTERN, "") || "/";
  return AUTHED_PAGE_PREFIXES.some(
    (prefix) =>
      withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`),
  );
}

/**
 * Revalidates the Supabase token and rotates cookies when needed, writing
 * them onto the provided response (which may be an intl redirect). Follows
 * the documented @supabase/ssr + next-intl composition pattern.
 */
async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Auth not configured: let pages render their honest "not available" state.
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not add logic between client creation and getUser() — see Supabase
  // SSR guidance.
  await supabase.auth.getUser();

  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes and the unprefixed auth route handlers: session refresh only.
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return refreshSupabaseSession(request, NextResponse.next({ request }));
  }

  const response = handleIntl(request);

  if (isAuthedPagePath(pathname)) {
    return refreshSupabaseSession(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    // All page routes except Next internals, metadata file routes and files
    // with extensions. /opengraph-image and /apple-icon are unprefixed
    // metadata routes and must not be locale-redirected.
    "/((?!api|_next|_vercel|opengraph-image|apple-icon|.*\\..*).*)",
    // API routes that need a fresh session (unchanged from before).
    "/api/connect/:path*",
    "/api/checkout",
    "/api/admin/:path*",
    "/api/profile/:path*",
    "/api/goals/:path*",
  ],
};
