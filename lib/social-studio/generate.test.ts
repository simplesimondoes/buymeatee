import { describe, expect, it } from "vitest";

import { validateGeneratedDraft } from "@/lib/social-studio/generate";
import { canPerform } from "@/lib/social-studio/types";

const valid = {
  objective: "Start a conversation about season goals",
  cta: "Reply with your goal",
  imageType: "none",
  imagePrompt: null,
  brandedText: null,
  xCopy: "What's the one golf goal you refuse to let slip this season?",
  blueskyCopy:
    "Serious question for the golfers here: what's the one goal you refuse to let slip this season?",
};

describe("validateGeneratedDraft", () => {
  it("accepts a well-formed draft", () => {
    const result = validateGeneratedDraft(JSON.stringify(valid));
    expect(result?.xCopy).toBe(valid.xCopy);
    expect(result?.imageType).toBe("none");
  });

  it("rejects malformed JSON and missing copy", () => {
    expect(validateGeneratedDraft("not json")).toBeNull();
    expect(
      validateGeneratedDraft(JSON.stringify({ ...valid, xCopy: "" })),
    ).toBeNull();
  });

  it("rejects duplicated platform copy — Bluesky must never mirror X", () => {
    expect(
      validateGeneratedDraft(
        JSON.stringify({ ...valid, blueskyCopy: valid.xCopy }),
      ),
    ).toBeNull();
  });

  it("rejects over-length copy", () => {
    expect(
      validateGeneratedDraft(JSON.stringify({ ...valid, xCopy: "a".repeat(300) })),
    ).toBeNull();
  });

  it("rejects off-brand fundraising vocabulary and URLs", () => {
    expect(
      validateGeneratedDraft(
        JSON.stringify({ ...valid, xCopy: "Donate to our campaign today" }),
      ),
    ).toBeNull();
    expect(
      validateGeneratedDraft(
        JSON.stringify({ ...valid, blueskyCopy: "Visit https://example.com now" }),
      ),
    ).toBeNull();
  });

  it("keeps image fields consistent with the image type", () => {
    const lifestyle = validateGeneratedDraft(
      JSON.stringify({
        ...valid,
        imageType: "lifestyle",
        imagePrompt: "A junior golfer practising at sunrise, natural light",
        brandedText: "should be dropped",
      }),
    );
    expect(lifestyle?.imagePrompt).toContain("junior golfer");
    expect(lifestyle?.brandedText).toBeNull();

    const branded = validateGeneratedDraft(
      JSON.stringify({
        ...valid,
        imageType: "branded",
        brandedText: "For Golfers With a Goal.",
        imagePrompt: "should be dropped",
      }),
    );
    expect(branded?.brandedText).toBe("For Golfers With a Goal.");
    expect(branded?.imagePrompt).toBeNull();
  });
});

describe("status workflow", () => {
  it("follows draft → ai_generated → edited → approved → published", () => {
    expect(canPerform("approve", "ai_generated")).toBe(true);
    expect(canPerform("approve", "edited")).toBe(true);
    expect(canPerform("approve", "approved")).toBe(false);
    expect(canPerform("publish", "approved")).toBe(true);
    expect(canPerform("publish", "edited")).toBe(false);
    expect(canPerform("publish", "published")).toBe(false);
    expect(canPerform("edit", "published")).toBe(false);
    expect(canPerform("edit", "approved")).toBe(true);
  });
});
