import {
  UPDATE_BODY_MAX_LENGTH,
  UPDATE_TITLE_MAX_LENGTH,
} from "@/lib/updates/types";

/**
 * Project update input validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — mutations revalidate everything).
 * Status changes (publish/unpublish) are handled separately.
 */

export interface UpdateInput {
  title: string;
  /** Markdown source; rendered only through the sanitising <Markdown>. */
  body: string;
}

export type UpdateFieldName = "title" | "body";

export type UpdateValidationResult =
  | { ok: true; data: UpdateInput }
  | { ok: false; errors: Partial<Record<UpdateFieldName, string>> };

export function validateUpdateInput(payload: unknown): UpdateValidationResult {
  const errors: Partial<Record<UpdateFieldName, string>> = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length < 1 || title.length > UPDATE_TITLE_MAX_LENGTH) {
    errors.title = `Give your update a title (up to ${UPDATE_TITLE_MAX_LENGTH} characters).`;
  }

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 1) {
    errors.body = "Write something for your supporters.";
  } else if (body.length > UPDATE_BODY_MAX_LENGTH) {
    errors.body = `Keep the update under ${UPDATE_BODY_MAX_LENGTH} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: { title, body } };
}
