import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  avatarObjectPath,
  matchesAvatarSignature,
  validateAvatarFile,
} from "@/lib/profile/avatar";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("matchesAvatarSignature", () => {
  it("recognises each supported format", () => {
    expect(matchesAvatarSignature("image/jpeg", JPEG)).toBe(true);
    expect(matchesAvatarSignature("image/png", PNG)).toBe(true);
    expect(matchesAvatarSignature("image/webp", WEBP)).toBe(true);
  });

  it("rejects bytes that don't match the declared type", () => {
    expect(matchesAvatarSignature("image/jpeg", PNG)).toBe(false);
    expect(matchesAvatarSignature("image/png", JPEG)).toBe(false);
    expect(matchesAvatarSignature("image/webp", JPEG)).toBe(false);
    expect(matchesAvatarSignature("image/jpeg", new Uint8Array([]))).toBe(false);
  });
});

describe("validateAvatarFile", () => {
  it("accepts a valid file", () => {
    expect(validateAvatarFile("image/png", 1024, PNG)).toBeNull();
  });

  it("rejects disallowed MIME types", () => {
    expect(validateAvatarFile("image/gif", 1024, PNG)).toBe("type");
    expect(validateAvatarFile("application/pdf", 1024, PNG)).toBe("type");
    expect(validateAvatarFile("", 1024, PNG)).toBe("type");
  });

  it("rejects empty and oversize files", () => {
    expect(validateAvatarFile("image/png", 0, PNG)).toBe("size");
    expect(validateAvatarFile("image/png", AVATAR_MAX_BYTES + 1, PNG)).toBe("size");
    expect(validateAvatarFile("image/png", AVATAR_MAX_BYTES, PNG)).toBeNull();
  });

  it("rejects content that contradicts the declared type", () => {
    expect(validateAvatarFile("image/png", 1024, JPEG)).toBe("content");
  });
});

describe("avatarObjectPath", () => {
  it("scopes the object to the user's folder", () => {
    expect(avatarObjectPath("abc-123")).toBe("abc-123/avatar");
  });
});
