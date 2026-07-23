import { NextResponse } from "next/server";

import { updateOwnProfile } from "@/lib/profile/profile";
import { validateProfileInput } from "@/lib/profile/profile-schema";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Updates the signed-in user's own profile. Validation is authoritative here;
 * RLS and the profiles table constraints are the final layer. The username
 * unique index decides races — there is no trust in a client-side check.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Profiles aren't available right now." },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (isRateLimited(`profile:${user.id}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const payload = await request.json().catch(() => null);
  const validation = validateProfileInput(payload);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await updateOwnProfile(user.id, validation.data);
  if (!result.ok) {
    if (result.reason === "username_taken") {
      return NextResponse.json(
        { errors: { username: "That link is already taken. Pick another." } },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Saving isn't available right now. Please try again." },
      { status: 503 },
    );
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
