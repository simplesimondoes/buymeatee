import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import {
  AVATAR_ERROR_DETAILS,
  avatarObjectPath,
  validateAvatarFile,
  type AvatarMimeType,
} from "@/lib/profile/avatar";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Upload (POST) or remove (DELETE) the signed-in user's avatar. Everything
 * runs on the session client: storage RLS confines writes to the user's own
 * folder and profile RLS confines the avatar_url update to their own row.
 * The upload overwrites one well-known object path, so replacing an avatar
 * never orphans storage objects; a version query defeats stale caches.
 */

const unavailable = () => apiError("api.avatarsUnavailable", { status: 503 });

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`avatar:${user.id}`, 10, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return apiError("api.chooseImage", { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = validateAvatarFile(file.type, bytes.byteLength, bytes.subarray(0, 16));
  if (problem) {
    // Transitional legacy string: errors.json has no code for image
    // type/size/content problems yet. useErrorMessage renders it as-is.
    return NextResponse.json(
      { error: AVATAR_ERROR_DETAILS[problem] },
      { status: 400 },
    );
  }

  try {
    const supabase = await getSupabaseServerClient();
    const path = avatarObjectPath(user.id);
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, bytes, {
        contentType: file.type as AvatarMimeType,
        upsert: true,
      });
    if (uploadError) {
      return unavailable();
    }

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
    // The object path never changes, so bust caches with an upload version.
    const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);
    if (profileError) {
      return unavailable();
    }

    return NextResponse.json({ avatarUrl });
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
      .from("avatars")
      .remove([avatarObjectPath(user.id)]);
    if (removeError) {
      return unavailable();
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);
    if (profileError) {
      return unavailable();
    }
    return NextResponse.json({ avatarUrl: null });
  } catch {
    return unavailable();
  }
}
