/**
 * Journey domain types, mirroring the journey_posts / journey_media /
 * journey_comments / journey_likes tables (migration 20260725193000, Phase 2).
 * Evolved from the earlier creator_updates model. Post bodies are markdown,
 * rendered only through the sanitising <Markdown> component (ADR-014).
 */

export const POST_KINDS = ["update", "milestone"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/** Goal-progress thresholds that produce an automatic milestone post. */
export const MILESTONE_PERCENTS = [25, 50, 75, 100] as const;
export type MilestonePercent = (typeof MILESTONE_PERCENTS)[number];

export const POST_TITLE_MAX_LENGTH = 200;
export const POST_BODY_MAX_LENGTH = 10_000;
export const COMMENT_BODY_MAX_LENGTH = 2_000;
export const VIDEO_URL_MAX_LENGTH = 500;
export const MILESTONE_LABEL_MAX_LENGTH = 120;

export interface JourneyPostRow {
  id: string;
  creator_id: string;
  title: string | null;
  body: string;
  image_url: string | null;
  kind: PostKind;
  goal_id: string | null;
  video_url: string | null;
  milestone_label: string | null;
  milestone_percent: MilestonePercent | null;
  like_count: number;
  comment_count: number;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyMediaRow {
  id: string;
  post_id: string;
  url: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
}

/** The public face of a commenter — only their public profile fields. */
export interface JourneyCommentAuthor {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface JourneyCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: JourneyCommentAuthor | null;
}

/** Shape Supabase returns before the embedded author relation is normalised. */
export type RawCommentRow = Omit<JourneyCommentRow, "author"> & {
  author: JourneyCommentAuthor | JourneyCommentAuthor[] | null;
};

/** Supabase types an embedded relation as an array — collapse it to one row. */
export function normaliseCommentAuthor(row: RawCommentRow): JourneyCommentRow {
  return {
    ...row,
    author: Array.isArray(row.author) ? (row.author[0] ?? null) : row.author,
  };
}

/** A published post assembled for the public feed. */
export interface JourneyFeedPost extends JourneyPostRow {
  media: JourneyMediaRow[];
  comments: JourneyCommentRow[];
  viewerHasLiked: boolean;
}

export const POST_COLUMNS =
  "id, creator_id, title, body, image_url, kind, goal_id, video_url, milestone_label, milestone_percent, like_count, comment_count, status, published_at, created_at, updated_at";

export const MEDIA_COLUMNS =
  "id, post_id, url, width, height, sort_order, created_at";

export const COMMENT_COLUMNS = "id, post_id, author_id, body, created_at";
