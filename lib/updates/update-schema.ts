import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import {
  UPDATE_BODY_MAX_LENGTH,
  UPDATE_TITLE_MAX_LENGTH,
} from "@/lib/updates/types";

/**
 * Project update input validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — mutations revalidate everything).
 * Errors are stable codes (ADR-019), rendered into the visitor's language at
 * the edge. Status changes (publish/unpublish) are handled separately.
 */

export interface UpdateInput {
  title: string;
  /** Markdown source; rendered only through the sanitising <Markdown>. */
  body: string;
}

export type UpdateFieldName = "title" | "body";

export type UpdateFieldErrors = Partial<Record<UpdateFieldName, ErrorDetail>>;

export type UpdateValidationResult =
  | { ok: true; data: UpdateInput }
  | { ok: false; errors: UpdateFieldErrors };

export function validateUpdateInput(payload: unknown): UpdateValidationResult {
  const errors: UpdateFieldErrors = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length < 1 || title.length > UPDATE_TITLE_MAX_LENGTH) {
    errors.title = errorDetail("validation.update.title", {
      max: UPDATE_TITLE_MAX_LENGTH,
    });
  }

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 1) {
    errors.body = errorDetail("validation.update.bodyRequired");
  } else if (body.length > UPDATE_BODY_MAX_LENGTH) {
    errors.body = errorDetail("validation.update.bodyLength", {
      max: UPDATE_BODY_MAX_LENGTH,
    });
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: { title, body } };
}
