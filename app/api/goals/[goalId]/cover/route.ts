import { NextResponse } from "next/server";

import type { AvatarMimeType } from "@/lib/profile/avatar";
import {
  COVER_ERROR_MESSAGES,
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

const UNAVAILABLE = NextResponse.json(
  { error: "Cover images aren't available right now. Please try again." },
  { status: 503 },
);

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return UNAVAILABLE;
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { goalId } = await params;
  if (!UUID.test(goalId)) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }
  if (isRateLimited(`goalcover:${user.id}`, 15, 60_000)) {
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
    const path = goalCoverObjectPath(user.id, goalId);
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
      return UNAVAILABLE;
    }
    if (!data) {
      return NextResponse.json({ error: "Goal not found." }, { status: 404 });
    }
    return NextResponse.json({ coverImageUrl });
  } catch {
    return UNAVAILABLE;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return UNAVAILABLE;
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { goalId } = await params;
  if (!UUID.test(goalId)) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error: removeError } = await supabase.storage
      .from("covers")
      .remove([goalCoverObjectPath(user.id, goalId)]);
    if (removeError) {
      return UNAVAILABLE;
    }
    const { error } = await supabase
      .from("creator_goals")
      .update({ cover_image_url: null })
      .eq("id", goalId)
      .eq("creator_id", user.id);
    if (error) {
      return UNAVAILABLE;
    }
    return NextResponse.json({ coverImageUrl: null });
  } catch {
    return UNAVAILABLE;
  }
}
