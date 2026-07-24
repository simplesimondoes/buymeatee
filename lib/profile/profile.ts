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
  cover_image_url: string | null;
  bio: string | null;
  country: string | null;
  handicap: number | null;
  location: string | null;
  home_club: string | null;
  handedness: "left" | "right" | null;
  social_youtube: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_website: string | null;
  role: "creator" | "supporter";
}

export type UpdateProfileResult =
  | { ok: true; profile: OwnProfile }
  | { ok: false; reason: "username_taken" | "unavailable" };

const OWN_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, cover_image_url, bio, country, handicap, location, home_club, handedness, social_youtube, social_instagram, social_tiktok, social_website, role";

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
  const fields = {
    username: input.username,
    display_name: input.displayName,
    bio: input.bio ?? null,
    country: input.country ?? null,
    handicap: input.handicap ?? null,
    location: input.location ?? null,
    home_club: input.homeClub ?? null,
    handedness: input.handedness ?? null,
    social_youtube: input.socialYoutube ?? null,
    social_instagram: input.socialInstagram ?? null,
    social_tiktok: input.socialTiktok ?? null,
    social_website: input.socialWebsite ?? null,
  };

  // The profile row is created by the handle_new_user trigger, so this is
  // normally a plain UPDATE — deliberately NOT an upsert. Column grants
  // exclude `id` from UPDATE (ADR-027 lockdown), and a PostgREST upsert would
  // try to set `id` in its ON CONFLICT clause and be denied. RLS + column
  // grants confine the write to the user's own row and columns.
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select(OWN_PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    // 23505 = unique_violation: someone else holds that username.
    if (error.code === "23505") {
      return { ok: false, reason: "username_taken" };
    }
    return { ok: false, reason: "unavailable" };
  }
  if (data) {
    return { ok: true, profile: data as OwnProfile };
  }

  // Fallback: no row existed (rare trigger-backfill gap). Insert one — the
  // INSERT grant does cover `id`.
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, ...fields })
    .select(OWN_PROFILE_COLUMNS)
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, reason: "username_taken" };
    }
    return { ok: false, reason: "unavailable" };
  }
  if (!inserted) {
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true, profile: inserted as OwnProfile };
}
