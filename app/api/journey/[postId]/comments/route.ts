import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { validateCommentBody } from "@/lib/journey/comment-schema";
import { addComment } from "@/lib/journey/interactions";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Post a comment on a published Journey post. Signed-in only; RLS enforces
 * that the author is the caller and the post is publicly visible.
 */

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.unavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { postId } = await params;
  if (!UUID.test(postId)) {
    return apiError("api.notFound", { status: 404 });
  }
  if (isRateLimited(`journey-comment:${user.id}`, 20, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const validation = validateCommentBody(payload);
  if (!validation.ok) {
    return apiError("api.checkFields", {
      status: 400,
      fields: { body: validation.error },
    });
  }

  const result = await addComment(user.id, postId, validation.body);
  if (!result.ok) {
    return apiError("api.unavailable", { status: 503 });
  }
  return NextResponse.json({ comment: result.comment });
}
