import "server-only";

import { getSupabaseAnonClient } from "@/lib/supabase/anon";
import {
  COMMENT_COLUMNS,
  MEDIA_COLUMNS,
  POST_COLUMNS,
  normaliseCommentAuthor,
  type JourneyCommentRow,
  type JourneyFeedPost,
  type JourneyMediaRow,
  type JourneyPostRow,
  type RawCommentRow,
} from "@/lib/journey/types";

/**
 * Public reads of a creator's published Journey. On the anonymous client the
 * RLS policies are what keep drafts, deactivated creators and deleted comments
 * invisible — the filters below only shape ordering within what RLS exposes.
 *
 * The feed is assembled in a few bounded queries (posts, then their media and
 * comments, then the viewer's own likes) rather than one deep join, so each
 * stays cheap and paginates cleanly (perf: journey should lazy-load).
 */

const POSTS_SHOWN = 20;
const COMMENTS_PER_POST = 50;

export async function getPublishedJourneyForCreator(
  creatorId: string,
  viewerId?: string | null,
): Promise<JourneyFeedPost[]> {
  const supabase = getSupabaseAnonClient();

  const { data: postData, error } = await supabase
    .from("journey_posts")
    .select(POST_COLUMNS)
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(POSTS_SHOWN);
  if (error) {
    throw new Error(`Failed to load journey: ${error.message}`);
  }
  const posts = (postData as JourneyPostRow[]) ?? [];
  if (posts.length === 0) {
    return [];
  }
  const postIds = posts.map((post) => post.id);

  const [mediaResult, commentsResult, likesResult] = await Promise.all([
    supabase
      .from("journey_media")
      .select(MEDIA_COLUMNS)
      .in("post_id", postIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("journey_comments")
      .select(
        `${COMMENT_COLUMNS}, author:profiles(display_name, username, avatar_url)`,
      )
      .in("post_id", postIds)
      .order("created_at", { ascending: true })
      .limit(COMMENTS_PER_POST * postIds.length),
    viewerId
      ? supabase
          .from("journey_likes")
          .select("post_id")
          .eq("user_id", viewerId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const media = (mediaResult.data as JourneyMediaRow[] | null) ?? [];
  const comments: JourneyCommentRow[] = (
    (commentsResult.data as unknown as RawCommentRow[] | null) ?? []
  ).map(normaliseCommentAuthor);
  const likedPostIds = new Set(
    ((likesResult.data as { post_id: string }[] | null) ?? []).map(
      (row) => row.post_id,
    ),
  );

  const mediaByPost = groupBy(media, (row) => row.post_id);
  const commentsByPost = groupBy(comments, (row) => row.post_id);

  return posts.map((post) => ({
    ...post,
    media: mediaByPost.get(post.id) ?? [],
    comments: commentsByPost.get(post.id) ?? [],
    viewerHasLiked: likedPostIds.has(post.id),
  }));
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const existing = map.get(k);
    if (existing) {
      existing.push(row);
    } else {
      map.set(k, [row]);
    }
  }
  return map;
}
