import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_DETAILS,
  goalCoverObjectPath,
  validateCoverFile,
} from "@/lib/profile/cover";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Upload (POST) or remove (DELETE) a cover image for one of the signed-in
 * user's goals. Ownership is enforced both by the explicit creator_id filter
 * on the update and by storage RLS (the object path is namespaced under the
 * user's own folder). Mirrors the profile cover route.
 */

const unavailable = () =>
  apiError("api.coverImagesUnavailable", { status: 503 });

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { goalId } = await params;
  if (!UUID.test(goalId)) {
    return apiError("api.goalNotFound", { status: 404 });
  }
  if (isRateLimited(`goalcover:${user.id}`, 15, 60_000)) {
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
    // Cover-file problems have no stable code yet (see lib/profile/cover);
    // the client hook passes raw strings through.
    return NextResponse.json({ error: COVER_ERROR_DETAILS[problem] }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const path = goalCoverObjectPath(user.id, goalId);
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
    const coverImageUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

    // The creator_id filter (with RLS) guarantees a user can only set a cover
    // on their own goal; a non-owned goalId updates zero rows.
    const { data, error } = await supabase
      .from("creator_goals")
      .update({ cover_image_url: coverImageUrl })
      .eq("id", goalId)
      .eq("creator_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return unavailable();
    }
    if (!data) {
      return apiError("api.goalNotFound", { status: 404 });
    }
    return NextResponse.json({ coverImageUrl });
  } catch {
    return unavailable();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { goalId } = await params;
  if (!UUID.test(goalId)) {
    return apiError("api.goalNotFound", { status: 404 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error: removeError } = await supabase.storage
      .from("covers")
      .remove([goalCoverObjectPath(user.id, goalId)]);
    if (removeError) {
      return unavailable();
    }
    const { error } = await supabase
      .from("creator_goals")
      .update({ cover_image_url: null })
      .eq("id", goalId)
      .eq("creator_id", user.id);
    if (error) {
      return unavailable();
    }
    return NextResponse.json({ coverImageUrl: null });
  } catch {
    return unavailable();
  }
}
