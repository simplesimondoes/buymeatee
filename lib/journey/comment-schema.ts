import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { COMMENT_BODY_MAX_LENGTH } from "@/lib/journey/types";

/**
 * Journey comment validation. Comments are lightweight and flat (no threads):
 * a single body, 1..2000 chars. Pure module, shared client + server.
 */

export type CommentValidationResult =
  | { ok: true; body: string }
  | { ok: false; error: ErrorDetail };

export function validateCommentBody(payload: unknown): CommentValidationResult {
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 1 || body.length > COMMENT_BODY_MAX_LENGTH) {
    return {
      ok: false,
      error: errorDetail("validation.comment.body", {
        max: COMMENT_BODY_MAX_LENGTH,
      }),
    };
  }
  return { ok: true, body };
}
