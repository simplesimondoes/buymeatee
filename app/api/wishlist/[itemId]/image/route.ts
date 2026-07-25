import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_DETAILS,
  validateCoverFile,
  wishlistItemImageObjectPath,
} from "@/lib/profile/cover";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Upload (POST) or remove (DELETE) the image for one of the signed-in user's
 * wish-list items (ADR-018). Reuses the public `covers` bucket: ownership is
 * enforced both by the explicit creator_id filter on the update and by storage
 * RLS (the object path is namespaced under the user's own folder). Mirrors the
 * goal cover route.
 */

const unavailable = () =>
  apiError("api.itemImagesUnavailable", { status: 503 });

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { itemId } = await params;
  if (!UUID.test(itemId)) {
    return apiError("api.itemNotFound", { status: 404 });
  }
  if (isRateLimited(`wishitemimage:${user.id}`, 15, 60_000)) {
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
    const path = wishlistItemImageObjectPath(user.id, itemId);
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

    // The creator_id filter (with RLS) guarantees a user can only set an image
    // on their own item; a non-owned itemId updates zero rows.
    const { data, error } = await supabase
      .from("wishlist_items")
      .update({ image_url: imageUrl })
      .eq("id", itemId)
      .eq("creator_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return unavailable();
    }
    if (!data) {
      return apiError("api.itemNotFound", { status: 404 });
    }
    return NextResponse.json({ coverImageUrl: imageUrl });
  } catch {
    return unavailable();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { itemId } = await params;
  if (!UUID.test(itemId)) {
    return apiError("api.itemNotFound", { status: 404 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error: removeError } = await supabase.storage
      .from("covers")
      .remove([wishlistItemImageObjectPath(user.id, itemId)]);
    if (removeError) {
      return unavailable();
    }
    const { error } = await supabase
      .from("wishlist_items")
      .update({ image_url: null })
      .eq("id", itemId)
      .eq("creator_id", user.id);
    if (error) {
      return unavailable();
    }
    return NextResponse.json({ coverImageUrl: null });
  } catch {
    return unavailable();
  }
}
