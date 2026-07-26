import { describe, expect, it } from "vitest";

import { validatePostInput } from "@/lib/journey/post-schema";

describe("validatePostInput", () => {
  it("accepts a minimal post (body only, no title)", () => {
    const result = validatePostInput({ body: "Great round today." });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBeNull();
      expect(result.data.body).toBe("Great round today.");
      expect(result.data.milestoneLabel).toBeNull();
    }
  });

  it("requires a body", () => {
    const result = validatePostInput({ title: "Hi", body: "  " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.body?.code).toBe("validation.update.bodyRequired");
    }
  });

  it("accepts a valid YouTube video and rejects other hosts", () => {
    const ok = validatePostInput({
      body: "Watch this",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.videoUrl).toContain("youtube.com");
    }

    const bad = validatePostInput({
      body: "Watch this",
      videoUrl: "https://vimeo.com/12345",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.videoUrl?.code).toBe("validation.journey.video");
    }
  });

  it("treats a milestone label as a manual milestone", () => {
    const result = validatePostInput({
      body: "Made it through!",
      milestoneLabel: "Qualified",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.milestoneLabel).toBe("Qualified");
    }
  });

  it("only keeps a well-formed goal id", () => {
    const good = validatePostInput({
      body: "x",
      goalId: "11111111-1111-1111-1111-111111111111",
    });
    expect(good.ok && good.data.goalId).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    const bad = validatePostInput({ body: "x", goalId: "not-a-uuid" });
    expect(bad.ok && bad.data.goalId).toBeNull();
  });
});
