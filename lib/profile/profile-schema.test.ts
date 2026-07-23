import { describe, expect, it } from "vitest";

import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  isReservedUsername,
  validateProfileInput,
} from "@/lib/profile/profile-schema";

const valid = {
  username: "callum-reid",
  displayName: "Callum Reid",
  bio: "Chasing a scratch handicap and filming every round.",
  country: "Scotland",
};

describe("validateProfileInput", () => {
  it("accepts a complete profile, lowercasing and trimming the username", () => {
    const result = validateProfileInput({
      ...valid,
      username: "  Callum-Reid ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.username).toBe("callum-reid");
      expect(result.data.displayName).toBe("Callum Reid");
    }
  });

  it("treats bio and country as optional", () => {
    const result = validateProfileInput({
      username: "callum",
      displayName: "Callum",
      bio: "  ",
      country: "",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bio).toBeUndefined();
      expect(result.data.country).toBeUndefined();
    }
  });

  it("rejects malformed usernames", () => {
    for (const username of [
      "ab", // too short
      "-callum", // leading hyphen
      "callum-", // trailing hyphen
      "cal_lum", // underscore
      "Callum!", // symbol survives lowercasing
      "a".repeat(41), // too long
      "",
    ]) {
      const result = validateProfileInput({ ...valid, username });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.username).toBeDefined();
      }
    }
  });

  it("rejects reserved usernames that would shadow platform routes", () => {
    for (const username of ["admin", "settings", "sign-in", "blog", "gifts"]) {
      expect(isReservedUsername(username)).toBe(true);
      const result = validateProfileInput({ ...valid, username });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.username).toContain("reserved");
      }
    }
  });

  it("requires a display name within bounds", () => {
    for (const displayName of ["", "   ", "x".repeat(DISPLAY_NAME_MAX_LENGTH + 1)]) {
      const result = validateProfileInput({ ...valid, displayName });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.displayName).toBeDefined();
      }
    }
  });

  it("rejects an oversize bio", () => {
    const result = validateProfileInput({
      ...valid,
      bio: "x".repeat(BIO_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.bio).toBeDefined();
    }
  });

  it("reports every invalid field at once for non-object payloads", () => {
    const result = validateProfileInput(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.username).toBeDefined();
      expect(result.errors.displayName).toBeDefined();
    }
  });
});
