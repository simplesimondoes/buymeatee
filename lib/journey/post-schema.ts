import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { isValidJourneyVideoUrl } from "@/lib/journey/video";
import {
  MILESTONE_LABEL_MAX_LENGTH,
  POST_BODY_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
} from "@/lib/journey/types";

/**
 * Journey post input validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — mutations revalidate everything).
 * Errors are stable codes (ADR-019), rendered into the visitor's language at
 * the edge. Status changes (publish/unpublish) are handled separately.
 *
 * Evolved from the earlier update schema: the title is now optional (photo or
 * milestone posts don't need a headline) and a post may carry an optional
 * goal link and a YouTube video URL.
 */

export interface PostInput {
  /** Optional headline. */
  title: string | null;
  /** Markdown source; rendered only through the sanitising <Markdown>. */
  body: string;
  /** Optional goal this post is about. */
  goalId: string | null;
  /** Optional YouTube URL (validated to a YouTube embed). */
  videoUrl: string | null;
  /**
   * When present, this is a manual milestone post (kind='milestone') — e.g.
   * "Qualified", "Won Event". Automatic goal-% milestones are created only by
   * the verified webhook path and are not editable through this input.
   */
  milestoneLabel: string | null;
}

export type PostFieldName = "title" | "body" | "videoUrl" | "milestoneLabel";

export type PostFieldErrors = Partial<Record<PostFieldName, ErrorDetail>>;

export type PostValidationResult =
  | { ok: true; data: PostInput }
  | { ok: false; errors: PostFieldErrors };

const UUID = /^[0-9a-f-]{36}$/i;

export function validatePostInput(payload: unknown): PostValidationResult {
  const errors: PostFieldErrors = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (rawTitle.length > POST_TITLE_MAX_LENGTH) {
    errors.title = errorDetail("validation.update.title", {
      max: POST_TITLE_MAX_LENGTH,
    });
  }
  const title = rawTitle.length > 0 ? rawTitle : null;

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < 1) {
    errors.body = errorDetail("validation.update.bodyRequired");
  } else if (body.length > POST_BODY_MAX_LENGTH) {
    errors.body = errorDetail("validation.update.bodyLength", {
      max: POST_BODY_MAX_LENGTH,
    });
  }

  const rawVideo =
    typeof input.videoUrl === "string" ? input.videoUrl.trim() : "";
  let videoUrl: string | null = null;
  if (rawVideo.length > 0) {
    if (!isValidJourneyVideoUrl(rawVideo)) {
      errors.videoUrl = errorDetail("validation.journey.video");
    } else {
      videoUrl = rawVideo;
    }
  }

  const rawGoal = typeof input.goalId === "string" ? input.goalId.trim() : "";
  const goalId = UUID.test(rawGoal) ? rawGoal : null;

  const rawMilestone =
    typeof input.milestoneLabel === "string" ? input.milestoneLabel.trim() : "";
  let milestoneLabel: string | null = null;
  if (rawMilestone.length > MILESTONE_LABEL_MAX_LENGTH) {
    errors.milestoneLabel = errorDetail("validation.journey.milestoneLabel", {
      max: MILESTONE_LABEL_MAX_LENGTH,
    });
  } else if (rawMilestone.length > 0) {
    milestoneLabel = rawMilestone;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: { title, body, goalId, videoUrl, milestoneLabel } };
}
