/**
 * Cover-image upload rules for profile hero images and goal cover images,
 * shared by the client (early feedback) and the server (authoritative).
 * Reuses the avatar magic-byte sniffing; only the size limit differs (covers
 * are wider). Bucket limits mirror these — see the covers storage migration.
 */

import {
  isAllowedAvatarType,
  matchesAvatarSignature,
  type AvatarMimeType,
} from "@/lib/profile/avatar";

/** 5 MB — keep in sync with the `covers` bucket file_size_limit. */
export const COVER_MAX_BYTES = 5 * 1024 * 1024;

export type CoverMimeType = AvatarMimeType;

export type CoverValidationError = "type" | "size" | "content";

/** Null when acceptable; otherwise which rule failed. */
export function validateCoverFile(
  declaredType: string,
  byteLength: number,
  leadingBytes: Uint8Array,
): CoverValidationError | null {
  if (!isAllowedAvatarType(declaredType)) {
    return "type";
  }
  if (byteLength === 0 || byteLength > COVER_MAX_BYTES) {
    return "size";
  }
  if (!matchesAvatarSignature(declaredType, leadingBytes)) {
    return "content";
  }
  return null;
}

export const COVER_ERROR_MESSAGES: Record<CoverValidationError, string> = {
  type: "Use a JPEG, PNG or WebP image.",
  size: "Keep the image under 5 MB.",
  content: "That file doesn't look like a valid image.",
};

/** Storage object path for a user's profile cover (extensionless on purpose). */
export function profileCoverObjectPath(userId: string): string {
  return `${userId}/profile-cover`;
}

/** Storage object path for a single goal's cover, namespaced by owner. */
export function goalCoverObjectPath(userId: string, goalId: string): string {
  return `${userId}/goal-${goalId}`;
}

/** Storage object path for a single update's image, namespaced by owner. */
export function updateImageObjectPath(userId: string, updateId: string): string {
  return `${userId}/update-${updateId}`;
}
