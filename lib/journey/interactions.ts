import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  COMMENT_COLUMNS,
  normaliseCommentAuthor,
  type JourneyCommentRow,
  type RawCommentRow,
} from "@/lib/journey/types";

/**
 * Supporter interactions on Journey posts: likes and comments. Signed-in only
 * (the route enforces auth; RLS enforces identity and the post-creator
 * moderation rule). Runs on the session client so `auth.uid()` is the acting
 * user — the like/comment can only ever be attributed to them.
 */

export type LikeResult =
  | { ok: true; liked: boolean }
  | { ok: false };

/** Toggle the caller's like on a post. Idempotent per (post, user). */
export async function toggleLike(
  userId: string,
  postId: string,
): Promise<LikeResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: existing } = await supabase
      .from("journey_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("journey_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      return error ? { ok: false } : { ok: true, liked: false };
    }

    const { error } = await supabase
      .from("journey_likes")
      .insert({ post_id: postId, user_id: userId });
    // A race that already inserted the like (unique PK) still leaves it liked.
    if (error && error.code !== "23505") {
      return { ok: false };
    }
    return { ok: true, liked: true };
  } catch {
    return { ok: false };
  }
}

export type CommentResult =
  | { ok: true; comment: JourneyCommentRow }
  | { ok: false; reason: "unavailable" };

export async function addComment(
  userId: string,
  postId: string,
  body: string,
): Promise<CommentResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("journey_comments")
      .insert({ post_id: postId, author_id: userId, body })
      .select(
        `${COMMENT_COLUMNS}, author:profiles(display_name, username, avatar_url)`,
      )
      .single();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return {
      ok: true,
      comment: normaliseCommentAuthor(data as unknown as RawCommentRow),
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Soft-delete a comment. RLS allows the author or the post's creator (for
 * moderation); the grant restricts clients to setting deleted_at only.
 */
export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<{ ok: boolean }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("journey_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    return { ok: !error && Boolean(data) };
  } catch {
    return { ok: false };
  }
}
