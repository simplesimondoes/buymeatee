/**
 * Avatar upload rules, shared by the client (early feedback) and the server
 * (authoritative). Storage bucket limits mirror these — see the avatars
 * storage migration. Magic-byte sniffing stops content smuggled under an
 * image MIME type; it is intentionally strict rather than clever.
 */

/** 2 MB — keep in sync with the bucket's file_size_limit. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarMimeType = (typeof AVATAR_ALLOWED_TYPES)[number];

export function isAllowedAvatarType(value: unknown): value is AvatarMimeType {
  return (
    typeof value === "string" &&
    (AVATAR_ALLOWED_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Verify the declared MIME type against the file's leading bytes.
 * JPEG: FF D8 FF · PNG: 89 50 4E 47 · WebP: "RIFF"…"WEBP".
 */
export function matchesAvatarSignature(
  type: AvatarMimeType,
  bytes: Uint8Array,
): boolean {
  switch (type) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes.length >= 4 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      );
    case "image/webp":
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 && // R
        bytes[1] === 0x49 && // I
        bytes[2] === 0x46 && // F
        bytes[3] === 0x46 && // F
        bytes[8] === 0x57 && // W
        bytes[9] === 0x45 && // E
        bytes[10] === 0x42 && // B
        bytes[11] === 0x50 // P
      );
  }
}

export type AvatarValidationError = "type" | "size" | "content";

/** Null when acceptable; otherwise which rule failed. */
export function validateAvatarFile(
  declaredType: string,
  byteLength: number,
  leadingBytes: Uint8Array,
): AvatarValidationError | null {
  if (!isAllowedAvatarType(declaredType)) {
    return "type";
  }
  if (byteLength === 0 || byteLength > AVATAR_MAX_BYTES) {
    return "size";
  }
  if (!matchesAvatarSignature(declaredType, leadingBytes)) {
    return "content";
  }
  return null;
}

export const AVATAR_ERROR_MESSAGES: Record<AvatarValidationError, string> = {
  type: "Use a JPEG, PNG or WebP image.",
  size: "Keep the image under 2 MB.",
  content: "That file doesn't look like a valid image.",
};

/** Storage object path for a user's single avatar (extensionless on purpose). */
export function avatarObjectPath(userId: string): string {
  return `${userId}/avatar`;
}
