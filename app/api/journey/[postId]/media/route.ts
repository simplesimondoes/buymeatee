import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_DETAILS,
  journeyMediaObjectPath,
  validateCoverFile,
} from "@/lib/profile/cover";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Add (POST) or remove (DELETE) a gallery image on one of the signed-in
 * creator's Journey posts. Ownership is enforced by the journey_media insert
 * RLS (the post's creator must be auth.uid()) and by the per-user storage path.
 * Images are stored in the shared `covers` bucket, mirroring goal covers.
 */

const unavailable = () => apiError("api.imagesUnavailable", { status: 503 });
const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { postId } = await params;
  if (!UUID.test(postId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }
  if (isRateLimited(`journeymedia:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return apiError("api.chooseImage", { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = validateCoverFile(file.type, bytes.byteLength, bytes.subarray(0, 16));
  if (problem) {
    return NextResponse.json({ error: COVER_ERROR_DETAILS[problem] }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const mediaId = crypto.randomUUID();
    const path = journeyMediaObjectPath(user.id, mediaId);
    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(path, bytes, {
        contentType: file.type as AvatarMimeType,
        upsert: true,
      });
    if (uploadError) {
      return unavailable();
    }
    const { data: publicUrl } = supabase.storage.from("covers").getPublicUrl(path);
    const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

    // Next sort_order = current max + 1 (RLS lets an owner read their own media).
    const { data: last } = await supabase
      .from("journey_media")
      .select("sort_order")
      .eq("post_id", postId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("journey_media")
      .insert({ id: mediaId, post_id: postId, url, sort_order: sortOrder })
      .select("id, post_id, url, width, height, sort_order, created_at")
      .maybeSingle();
    if (error || !data) {
      // Insert blocked by RLS (not the owner's post) or unavailable.
      return apiError("api.updateNotFound", { status: 404 });
    }
    return NextResponse.json({ media: data });
  } catch {
    return unavailable();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { postId } = await params;
  if (!UUID.test(postId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }
  const url = new URL(request.url);
  const mediaId = url.searchParams.get("mediaId") ?? "";
  if (!UUID.test(mediaId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.storage
      .from("covers")
      .remove([journeyMediaObjectPath(user.id, mediaId)]);
    // RLS confines the delete to media on the caller's own post.
    const { error } = await supabase
      .from("journey_media")
      .delete()
      .eq("id", mediaId)
      .eq("post_id", postId);
    if (error) {
      return unavailable();
    }
    return NextResponse.json({ ok: true });
  } catch {
    return unavailable();
  }
}
