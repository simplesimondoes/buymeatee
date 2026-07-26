import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isMerchCreatorStudioOpen } from "@/lib/merch/config";
import { merchArtworkObjectPath, validateArtworkFile } from "@/lib/merch/artwork";
import { MERCH_TERMS_VERSION } from "@/lib/merch/types";
import type { AvatarMimeType } from "@/lib/profile/avatar";
import { COVER_ERROR_DETAILS } from "@/lib/profile/cover";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Upload one artwork file for the signed-in creator (ADR-024, spec §7).
 *
 * Requires the creator to confirm they own/are licensed to use the artwork; the
 * confirmation, terms version and file metadata are recorded on
 * merch_artwork_files for the audit trail. Reuses the public `covers` bucket
 * with per-user-folder RLS + magic-byte validation. Returns the file id to
 * attach to a product.
 */

const unavailable = () => apiError("api.unavailable", { status: 503 });

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return unavailable();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!isMerchCreatorStudioOpen()) {
    return unavailable();
  }
  if (isRateLimited(`merchartwork:${user.id}`, 15, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return apiError("api.chooseImage", { status: 400 });
  }
  // The creator must confirm rights before the artwork can be stored (§7).
  if (formData?.get("rightsConfirmed") !== "true") {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = validateArtworkFile(file.type, bytes.byteLength, bytes.subarray(0, 16));
  if (problem) {
    return NextResponse.json({ error: COVER_ERROR_DETAILS[problem] }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const fileId = crypto.randomUUID();
    const path = merchArtworkObjectPath(user.id, fileId);

    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(path, bytes, {
        contentType: file.type as AvatarMimeType,
        upsert: true,
      });
    if (uploadError) {
      return unavailable();
    }

    const checksum = createHash("sha256").update(bytes).digest("hex");
    const { data, error } = await supabase
      .from("merch_artwork_files")
      .insert({
        creator_id: user.id,
        storage_path: path,
        checksum,
        mime_type: file.type,
        byte_size: bytes.byteLength,
        rights_confirmed: true,
        terms_version: MERCH_TERMS_VERSION,
      })
      .select("id")
      .single();
    if (error || !data) {
      return unavailable();
    }

    const { data: publicUrl } = supabase.storage.from("covers").getPublicUrl(path);
    return NextResponse.json({
      artworkFileId: (data as { id: string }).id,
      url: publicUrl.publicUrl,
    });
  } catch {
    return unavailable();
  }
}
