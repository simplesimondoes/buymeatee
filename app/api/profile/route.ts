import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { updateOwnProfile } from "@/lib/profile/profile";
import { validateProfileInput } from "@/lib/profile/profile-schema";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Updates the signed-in user's own profile. Validation is authoritative here;
 * RLS and the profiles table constraints are the final layer. The username
 * unique index decides races — there is no trust in a client-side check.
 * Errors are stable codes (ADR-019) rendered into language by the client.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("api.profilesUnavailable", { status: 503 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }

  if (isRateLimited(`profile:${user.id}`, 20, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const validation = validateProfileInput(payload);
  if (!validation.ok) {
    return apiError("api.checkFields", {
      status: 400,
      // pinnedMediaUrl may still carry a transitional legacy string — the
      // client's useErrorMessage renders both shapes.
      fields: validation.errors as Record<string, ErrorDetail>,
    });
  }

  const result = await updateOwnProfile(user.id, validation.data);
  if (!result.ok) {
    if (result.reason === "username_taken") {
      return apiError("api.checkFields", {
        status: 409,
        fields: { username: errorDetail("validation.profile.usernameTaken") },
      });
    }
    return apiError("api.savingUnavailable", { status: 503 });
  }

  return NextResponse.json({
    profile: {
      username: result.profile.username,
      displayName: result.profile.display_name,
      bio: result.profile.bio,
      country: result.profile.country,
    },
  });
}
