/**
 * Project update domain types, mirroring the creator_updates table
 * (migration 20260724130000). Body is markdown, rendered only through the
 * sanitising <Markdown> component (ADR-014).
 */

export const UPDATE_STATUSES = ["draft", "published"] as const;
export type UpdateStatus = (typeof UPDATE_STATUSES)[number];

export const UPDATE_TITLE_MAX_LENGTH = 200;
export const UPDATE_BODY_MAX_LENGTH = 10_000;

export interface CreatorUpdateRow {
  id: string;
  creator_id: string;
  title: string;
  body: string;
  image_url: string | null;
  status: UpdateStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const UPDATE_COLUMNS =
  "id, creator_id, title, body, image_url, status, published_at, created_at, updated_at";
