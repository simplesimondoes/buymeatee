import { NextResponse } from "next/server";

import { isAppLocale } from "@/i18n/locales";
import { apiError } from "@/lib/api/errors";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Persists the signed-in user's language choice (profiles.preferred_locale).
 * Deliberately separate from the full profile update: the language switcher
 * fires this without knowing anything else about the profile. Anonymous
 * visitors are covered by the NEXT_LOCALE cookie alone.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("api.profilesUnavailable", { status: 503 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }

  if (isRateLimited(`profile-locale:${user.id}`, 20, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = (await request.json().catch(() => null)) as {
    preferredLocale?: unknown;
  } | null;
  const preferredLocale = payload?.preferredLocale;
  if (!isAppLocale(preferredLocale)) {
    return apiError("validation.profile.preferredLocale", { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ preferred_locale: preferredLocale })
    .eq("id", user.id);

  if (error) {
    return apiError("api.savingUnavailable", { status: 503 });
  }

  return NextResponse.json({ preferredLocale });
}
