import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import {
  duplicateDraft,
  getDraft,
  updateDraft,
} from "@/lib/social-studio/drafts";
import { generateDraft } from "@/lib/social-studio/generate";
import {
  canPerform,
  SOCIAL_IMAGE_TYPES,
  type SocialDraftRow,
  type SocialImageType,
} from "@/lib/social-studio/types";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

export const maxDuration = 60;

/**
 * Draft actions for the Social Content Studio (ADR-023): edit, regenerate,
 * approve, publish, duplicate. Owner-only; the server owns the status
 * workflow (draft → ai_generated → edited → approved → published).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.unavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user || !canViewAnalytics(user.email)) {
    return apiError("api.notAuthorised", { status: 404 });
  }

  const { draftId } = await params;
  const draft = await getDraft(draftId).catch(() => null);
  if (!draft) {
    return apiError("api.notFound", { status: 404 });
  }

  const payload = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const action = typeof payload.action === "string" ? payload.action : "";

  try {
    switch (action) {
      case "edit":
        return respond(await applyEdit(draft, payload));
      case "regenerateCopy":
      case "regenerateImage":
        return respond(await applyRegenerate(draft, action));
      case "approve":
        if (!canPerform("approve", draft.status)) {
          return apiError("api.invalidRequest", { status: 400 });
        }
        return respond(await updateDraft(draft.id, { status: "approved" }));
      case "publish":
        if (!canPerform("publish", draft.status)) {
          return apiError("api.invalidRequest", { status: 400 });
        }
        return respond(
          await updateDraft(draft.id, {
            status: "published",
            published_at: new Date().toISOString(),
          }),
        );
      case "duplicate":
        return respond(await duplicateDraft(draft));
      default:
        return apiError("api.unknownAction", { status: 400 });
    }
  } catch (error) {
    console.error(
      "social draft action failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return apiError("api.unavailable", { status: 503 });
  }
}

function respond(draft: SocialDraftRow | null) {
  if (!draft) {
    return apiError("api.unavailable", { status: 503 });
  }
  return NextResponse.json({ draft });
}

async function applyEdit(
  draft: SocialDraftRow,
  payload: Record<string, unknown>,
): Promise<SocialDraftRow | null> {
  if (!canPerform("edit", draft.status)) {
    return null;
  }
  const text = (value: unknown, max: number): string | undefined =>
    typeof value === "string" ? value.trim().slice(0, max) : undefined;
  const imageType =
    typeof payload.imageType === "string" &&
    (SOCIAL_IMAGE_TYPES as readonly string[]).includes(payload.imageType)
      ? (payload.imageType as SocialImageType)
      : undefined;

  return updateDraft(draft.id, {
    x_copy: text(payload.xCopy, 280) ?? draft.x_copy,
    bluesky_copy: text(payload.blueskyCopy, 300) ?? draft.bluesky_copy,
    objective: text(payload.objective, 300) ?? draft.objective,
    cta: text(payload.cta, 200) ?? draft.cta,
    image_type: imageType ?? draft.image_type,
    image_prompt: text(payload.imagePrompt, 600) ?? draft.image_prompt,
    branded_text: text(payload.brandedText, 120) ?? draft.branded_text,
    // Human edits honestly demote approved content back to "edited".
    status: "edited",
  });
}

async function applyRegenerate(
  draft: SocialDraftRow,
  action: "regenerateCopy" | "regenerateImage",
): Promise<SocialDraftRow | null> {
  if (!canPerform("regenerate", draft.status)) {
    return null;
  }
  const content = await generateDraft({
    scheduledFor: draft.scheduled_for,
    slot: draft.slot,
    pillar: draft.pillar,
    audience: draft.audience,
  });
  if (!content) {
    return null;
  }
  if (action === "regenerateImage") {
    // One generation path (a full draft), applied selectively: only the image
    // recommendation changes; the approved-or-edited copy stays intact.
    return updateDraft(draft.id, {
      image_type: content.imageType,
      image_prompt: content.imagePrompt,
      branded_text: content.brandedText,
      status: draft.status === "published" ? draft.status : "edited",
    });
  }
  return updateDraft(draft.id, {
    objective: content.objective,
    cta: content.cta,
    image_type: content.imageType,
    image_prompt: content.imagePrompt,
    branded_text: content.brandedText,
    x_copy: content.xCopy,
    bluesky_copy: content.blueskyCopy,
    status: "ai_generated",
  });
}
