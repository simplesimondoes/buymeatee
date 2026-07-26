import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { toggleLike } from "@/lib/journey/interactions";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Toggle the signed-in supporter's like on a published post. Signed-in only —
 * anonymous callers get 401 and the client shows a sign-in prompt.
 */

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  _request: Request,
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
  if (isRateLimited(`journey-like:${user.id}`, 60, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const result = await toggleLike(user.id, postId);
  if (!result.ok) {
    return apiError("api.unavailable", { status: 503 });
  }
  return NextResponse.json({ liked: result.liked });
}
