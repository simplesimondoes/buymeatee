import { NextResponse } from "next/server";

import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_MESSAGES,
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
 * Upload (POST) or remove (DELETE) the image on one of the signed-in creator's
 * updates. Ownership is enforced by the creator_id filter on the update (plus
 * RLS) and by the per-user storage path. Mirrors the goal cover route.
 */

const UNAVAILABLE = NextResponse.json(
  { error: "Images aren't available right now. Please try again." },
  { status: 503 },
);

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ updateId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return UNAVAILABLE;
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { updateId } = await params;
  if (!UUID.test(updateId)) {
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }
  if (isRateLimited(`updateimg:${user.id}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = validateCoverFile(file.type, bytes.byteLength, bytes.subarray(0, 16));
  if (problem) {
    return NextResponse.json({ error: COVER_ERROR_MESSAGES[problem] }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const path = updateImageObjectPath(user.id, updateId);
    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(path, bytes, {
        contentType: file.type as AvatarMimeType,
        upsert: true,
      });
    if (uploadError) {
      return UNAVAILABLE;
    }

    const { data: publicUrl } = supabase.storage.from("covers").getPublicUrl(path);
    const imageUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

    const { data, error } = await supabase
      .from("creator_updates")
      .update({ image_url: imageUrl })
      .eq("id", updateId)
      .eq("creator_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return UNAVAILABLE;
    }
    if (!data) {
      return NextResponse.json({ error: "Update not found." }, { status: 404 });
    }
    return NextResponse.json({ coverImageUrl: imageUrl });
  } catch {
    return UNAVAILABLE;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ updateId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return UNAVAILABLE;
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { updateId } = await params;
  if (!UUID.test(updateId)) {
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error: removeError } = await supabase.storage
      .from("covers")
      .remove([updateImageObjectPath(user.id, updateId)]);
    if (removeError) {
      return UNAVAILABLE;
    }
    const { error } = await supabase
      .from("creator_updates")
      .update({ image_url: null })
      .eq("id", updateId)
      .eq("creator_id", user.id);
    if (error) {
      return UNAVAILABLE;
    }
    return NextResponse.json({ coverImageUrl: null });
  } catch {
    return UNAVAILABLE;
  }
}
