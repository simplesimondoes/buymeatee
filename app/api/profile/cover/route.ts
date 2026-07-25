import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_DETAILS,
  profileCoverObjectPath,
  validateCoverFile,
} from "@/lib/profile/cover";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Upload (POST) or remove (DELETE) the signed-in user's profile cover image.
 * Everything runs on the session client: storage RLS confines writes to the
 * user's own folder in the `covers` bucket and profile RLS confines the
 * cover_image_url update to their own row. One well-known object path per
 * user, overwritten in place, so replacing a cover never orphans storage.
 */

const unavailable = () => apiError("api.coverImagesUnavailable", { status: 503 });

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`cover:${user.id}`, 10, 60_000)) {
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
    // Transitional legacy string: errors.json has no code for image
    // type/size/content problems yet. useErrorMessage renders it as-is.
    return NextResponse.json({ error: COVER_ERROR_DETAILS[problem] }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const path = profileCoverObjectPath(user.id);
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

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ cover_image_url: coverImageUrl })
      .eq("id", user.id);
    if (profileError) {
      return unavailable();
    }

    return NextResponse.json({ coverImageUrl });
  } catch {
    return unavailable();
  }
}

export async function DELETE() {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error: removeError } = await supabase.storage
      .from("covers")
      .remove([profileCoverObjectPath(user.id)]);
    if (removeError) {
      return unavailable();
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ cover_image_url: null })
      .eq("id", user.id);
    if (profileError) {
      return unavailable();
    }
    return NextResponse.json({ coverImageUrl: null });
  } catch {
    return unavailable();
  }
}
