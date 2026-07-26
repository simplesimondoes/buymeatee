import "server-only";

import type { PostInput } from "@/lib/journey/post-schema";
import {
  POST_COLUMNS,
  type JourneyPostRow,
  type PostStatus,
} from "@/lib/journey/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Journey post reads and mutations for the post's owner. Everything runs on
 * the session client — RLS confines each operation to the caller's own posts,
 * and column grants keep id/timestamps/counters/milestone-identity
 * server-owned (mirrors lib/goals/goals.ts). Evolved from lib/updates.
 */

export type PostMutationResult =
  | { ok: true; post: JourneyPostRow }
  | { ok: false; reason: "not_found" | "unavailable" };

export async function getOwnPosts(userId: string): Promise<JourneyPostRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("journey_posts")
    .select(POST_COLUMNS)
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load journey posts: ${error.message}`);
  }
  return (data as JourneyPostRow[]) ?? [];
}

async function getOwnPost(
  userId: string,
  postId: string,
): Promise<JourneyPostRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("journey_posts")
    .select(POST_COLUMNS)
    .eq("creator_id", userId)
    .eq("id", postId)
    .maybeSingle();
  return (data as JourneyPostRow | null) ?? null;
}

export async function createPost(
  userId: string,
  input: PostInput,
): Promise<PostMutationResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("journey_posts")
      .insert({
        creator_id: userId,
        title: input.title,
        body: input.body,
        goal_id: input.goalId,
        video_url: input.videoUrl,
        milestone_label: input.milestoneLabel,
        kind: input.milestoneLabel ? "milestone" : "update",
        status: "draft",
      })
      .select(POST_COLUMNS)
      .single();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, post: data as JourneyPostRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function editPost(
  userId: string,
  postId: string,
  input: PostInput,
): Promise<PostMutationResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("journey_posts")
      .update({
        title: input.title,
        body: input.body,
        goal_id: input.goalId,
        video_url: input.videoUrl,
        milestone_label: input.milestoneLabel,
        kind: input.milestoneLabel ? "milestone" : "update",
      })
      .eq("creator_id", userId)
      .eq("id", postId)
      .select(POST_COLUMNS)
      .maybeSingle();
    if (error) {
      return { ok: false, reason: "unavailable" };
    }
    if (!data) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: true, post: data as JourneyPostRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function setPostStatus(
  userId: string,
  postId: string,
  status: PostStatus,
): Promise<PostMutationResult> {
  try {
    const existing = await getOwnPost(userId, postId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    const patch: { status: PostStatus; published_at?: string } = { status };
    // First publish stamps published_at (feed ordering); it's kept across an
    // unpublish/re-publish so the original date stands.
    if (status === "published" && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("journey_posts")
      .update(patch)
      .eq("creator_id", userId)
      .eq("id", postId)
      .select(POST_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, post: data as JourneyPostRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function deletePost(
  userId: string,
  postId: string,
): Promise<{ ok: boolean }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("journey_posts")
      .delete()
      .eq("creator_id", userId)
      .eq("id", postId);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
