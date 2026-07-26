import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { validatePostInput } from "@/lib/journey/post-schema";
import {
  deletePost,
  editPost,
  setPostStatus,
  type PostMutationResult,
} from "@/lib/journey/posts";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Mutations for one of the signed-in creator's Journey posts: edit content,
 * publish or unpublish (POST with an `action`), or delete (DELETE). Ownership
 * is enforced by the domain layer's creator_id filter plus RLS.
 */

const UUID = /^[0-9a-f-]{36}$/i;

function respond(result: PostMutationResult) {
  if (result.ok) {
    return NextResponse.json({ post: result.post });
  }
  if (result.reason === "not_found") {
    return apiError("api.updateNotFound", { status: 404 });
  }
  return apiError("api.updateSaveFailed", { status: 503 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.updatesUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { postId } = await params;
  if (!UUID.test(postId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }
  if (isRateLimited(`journey:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: string }
    | null;

  switch (body?.action) {
    case "edit": {
      const validation = validatePostInput(body);
      if (!validation.ok) {
        return apiError("api.checkFields", {
          status: 400,
          fields: validation.errors,
        });
      }
      return respond(await editPost(user.id, postId, validation.data));
    }
    case "publish":
      return respond(await setPostStatus(user.id, postId, "published"));
    case "unpublish":
      return respond(await setPostStatus(user.id, postId, "draft"));
    default:
      return apiError("api.unknownAction", { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.updatesUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { postId } = await params;
  if (!UUID.test(postId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }

  const result = await deletePost(user.id, postId);
  if (!result.ok) {
    return apiError("api.updateDeleteFailed", { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
