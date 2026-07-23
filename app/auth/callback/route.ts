import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeRelativePath } from "@/lib/auth/safe-path";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Completes a magic-link sign-in. Supports both Supabase flows:
 *  - PKCE: ?code=...            → exchangeCodeForSession
 *  - Token hash: ?token_hash=...&type=email → verifyOtp
 * Redirect targets are restricted to same-site relative paths.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/sign-in?error=unavailable", requestUrl.origin));
  }

  const supabase = await getSupabaseServerClient();
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/sign-in?error=link-invalid", requestUrl.origin),
  );
}
