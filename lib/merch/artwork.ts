import "server-only";

import {
  COVER_MAX_BYTES,
  validateCoverFile,
  type CoverValidationError,
} from "@/lib/profile/cover";

/**
 * Creator artwork validation + storage paths (ADR-024, spec §7).
 *
 * MVP reuses the existing public `covers` bucket and its magic-byte validation
 * (PNG / JPEG / WebP, 5 MB; SVG intentionally excluded — no sanitiser exists).
 * Artwork lives under a per-user folder so the bucket's owner-folder write RLS
 * applies. Printful pulls the file by its public URL at fulfilment time.
 */

export const ARTWORK_MAX_BYTES = COVER_MAX_BYTES;
export type ArtworkValidationError = CoverValidationError;

/** Validate declared type + size + leading bytes. Returns null when valid. */
export function validateArtworkFile(
  declaredType: string,
  byteLength: number,
  leadingBytes: Uint8Array,
): ArtworkValidationError | null {
  return validateCoverFile(declaredType, byteLength, leadingBytes);
}

/** Storage object path for one artwork file (per-user folder, spec §7 RLS). */
export function merchArtworkObjectPath(userId: string, fileId: string): string {
  return `${userId}/merch-artwork/${fileId}`;
}
