import "server-only";

import type { SupportedCurrency } from "@/lib/payments/currency";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";

/**
 * Cross-creator public reads for Discover, on the anonymous client.
 *
 * RLS is what keeps these safe, not filters someone could forget:
 *  - profiles: "viewable by everyone" but deactivated profiles are hidden from
 *    anon (admin-user-management policy), so an inner join to profiles also
 *    drops a deactivated creator's goals and updates automatically.
 *  - creator_goals: only 'active'/'completed' rows are selectable by anon.
 *  - journey_posts: only 'published' rows of an active creator.
 */

export type PublicCreatorRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  created_at: string;
};

export type PublicGoalRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  currency: SupportedCurrency;
  target_amount: number;
  raised_amount: number;
  status: "active" | "completed";
  created_at: string;
  updated_at: string;
  creator: {
    username: string | null;
    display_name: string;
    avatar_url: string | null;
    cover_image_url: string | null;
    location: string | null;
    country: string | null;
  } | null;
};

const CREATOR_COLUMNS =
  "id, username, display_name, avatar_url, cover_image_url, bio, location, country, created_at";

const GOAL_COLUMNS =
  "id, creator_id, title, description, cover_image_url, currency, target_amount, raised_amount, status, created_at, updated_at, creator:profiles!inner(username, display_name, avatar_url, cover_image_url, location, country)";

/** Public creators with a claimed page, newest first. */
export async function listPublicCreators(): Promise<PublicCreatorRow[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(CREATOR_COLUMNS)
    .eq("role", "creator")
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) {
    throw new Error(`Failed to load creators: ${error.message}`);
  }
  return (data as PublicCreatorRow[]) ?? [];
}

/** Every publicly-visible goal across creators, with its creator's public info. */
export async function listPublicGoals(): Promise<PublicGoalRow[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("creator_goals")
    .select(GOAL_COLUMNS)
    .in("status", ["active", "completed"])
    .is("taken_down_at", null)
    .order("updated_at", { ascending: false })
    .limit(120);
  if (error) {
    throw new Error(`Failed to load goals: ${error.message}`);
  }
  // Supabase types an embedded relation as an array; normalise to a single row.
  return ((data as unknown as (Omit<PublicGoalRow, "creator"> & {
    creator: PublicGoalRow["creator"] | PublicGoalRow["creator"][];
  })[]) ?? []).map((row) => ({
    ...row,
    creator: Array.isArray(row.creator) ? row.creator[0] ?? null : row.creator,
  }));
}

export type RecentUpdateRow = {
  creator_id: string;
  published_at: string | null;
  title: string | null;
};

/** Creators who most recently published a Journey post. */
export async function listRecentlyUpdated(): Promise<RecentUpdateRow[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("journey_posts")
    .select("creator_id, published_at, title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);
  if (error) {
    throw new Error(`Failed to load updates: ${error.message}`);
  }
  return (data as RecentUpdateRow[]) ?? [];
}
