import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes Supabase auth sessions for the app areas that need a user
 * (payments, dashboards, admin). Marketing pages stay outside the matcher so
 * they remain fully static.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Revalidates the token and rotates cookies when needed. Do not add logic
  // between client creation and getUser() — see Supabase SSR guidance.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/settings/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/sign-in",
    "/auth/:path*",
    "/api/connect/:path*",
    "/api/checkout",
    "/api/admin/:path*",
    "/api/profile/:path*",
    "/api/goals/:path*",
  ],
};
