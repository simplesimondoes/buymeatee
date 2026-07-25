import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isSharePersonalisationConfigured,
  personaliseShareCopy,
  validateSuggestion,
} from "@/lib/share/personalise";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isSharePersonalisationConfigured", () => {
  it("is false without an API key and true with one", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(isSharePersonalisationConfigured()).toBe(false);
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    expect(isSharePersonalisationConfigured()).toBe(true);
  });
});

describe("personaliseShareCopy", () => {
  it("returns null when not configured — templates remain the experience", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await personaliseShareCopy({
      kind: "update",
      locale: "en",
      context: { title: "Broke 80" },
    });
    expect(result).toBeNull();
  });
});

describe("validateSuggestion", () => {
  it("trims whitespace and surrounding quotes", () => {
    expect(validateSuggestion('  "Great round today ⛳️"  ')).toBe(
      "Great round today ⛳️",
    );
  });

  it("rejects empty and over-long suggestions", () => {
    expect(validateSuggestion("")).toBeNull();
    expect(validateSuggestion("   ")).toBeNull();
    expect(validateSuggestion("A".repeat(400))).toBeNull();
  });

  it("rejects off-brand fundraising vocabulary", () => {
    expect(validateSuggestion("Please donate to my fund")).toBeNull();
    expect(validateSuggestion("My crowdfunding page is live")).toBeNull();
  });

  it("rejects suggestions that smuggle in a URL (the link is appended separately)", () => {
    expect(validateSuggestion("Check https://example.com now")).toBeNull();
  });

  it("passes an on-brand suggestion through unchanged", () => {
    const text = "One step closer to Q-School — thank you for the support ⛳️";
    expect(validateSuggestion(text)).toBe(text);
  });
});
