import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { deleteComment } from "@/lib/journey/interactions";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Soft-delete a comment. RLS allows the comment's author or the post's creator
 * (moderation); anyone else is silently a no-op that returns not-found.
 */

const UUID = /^[0-9a-f-]{36}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.unavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { commentId } = await params;
  if (!UUID.test(commentId)) {
    return apiError("api.notFound", { status: 404 });
  }

  const result = await deleteComment(user.id, commentId);
  if (!result.ok) {
    return apiError("api.notFound", { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
