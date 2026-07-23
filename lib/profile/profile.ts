import "server-only";

import type { ProfileInput } from "@/lib/profile/profile-schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The signed-in user's own profile row. All reads and writes here run on the
 * session client — RLS ("users manage only their own row") is the
 * authorisation layer, never this code.
 */

export interface OwnProfile {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  role: "creator" | "supporter";
}

export type UpdateProfileResult =
  | { ok: true; profile: OwnProfile }
  | { ok: false; reason: "username_taken" | "unavailable" };

const OWN_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, country, role";

export async function getOwnProfile(userId: string): Promise<OwnProfile | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(OWN_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }
  return (data as OwnProfile | null) ?? null;
}

export async function updateOwnProfile(
  userId: string,
  input: ProfileInput,
): Promise<UpdateProfileResult> {
  const supabase = await getSupabaseServerClient();
  // Upsert covers the rare profile-less user (e.g. trigger backfill gap);
  // RLS restricts both paths to the user's own row.
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        username: input.username,
        display_name: input.displayName,
        bio: input.bio ?? null,
        country: input.country ?? null,
      },
      { onConflict: "id" },
    )
    .select(OWN_PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    // 23505 = unique_violation: someone else holds that username.
    if (error.code === "23505") {
      return { ok: false, reason: "username_taken" };
    }
    return { ok: false, reason: "unavailable" };
  }
  if (!data) {
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true, profile: data as OwnProfile };
}
