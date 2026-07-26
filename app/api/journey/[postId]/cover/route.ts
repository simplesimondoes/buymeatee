import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_DETAILS,
  updateImageObjectPath,
  validateCoverFile,
} from "@/lib/profile/cover";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Upload (POST) or remove (DELETE) the primary image on one of the signed-in
 * creator's Journey posts. Ownership is enforced by the creator_id filter (plus
 * RLS) and the per-user storage path. Mirrors the goal cover route. Additional
 * gallery images use the sibling /media route.
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
  if (isRateLimited(`journeyimg:${user.id}`, 20, 60_000)) {
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
    const path = updateImageObjectPath(user.id, postId);
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
    const imageUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

    const { data, error } = await supabase
      .from("journey_posts")
      .update({ image_url: imageUrl })
      .eq("id", postId)
      .eq("creator_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return unavailable();
    }
    if (!data) {
      return apiError("api.updateNotFound", { status: 404 });
    }
    return NextResponse.json({ coverImageUrl: imageUrl });
  } catch {
    return unavailable();
  }
}

export async function DELETE(
  _request: Request,
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

  try {
    const supabase = await getSupabaseServerClient();
    const { error: removeError } = await supabase.storage
      .from("covers")
      .remove([updateImageObjectPath(user.id, postId)]);
    if (removeError) {
      return unavailable();
    }
    const { error } = await supabase
      .from("journey_posts")
      .update({ image_url: null })
      .eq("id", postId)
      .eq("creator_id", user.id);
    if (error) {
      return unavailable();
    }
    return NextResponse.json({ coverImageUrl: null });
  } catch {
    return unavailable();
  }
}
