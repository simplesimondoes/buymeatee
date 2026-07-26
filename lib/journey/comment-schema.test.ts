import { describe, expect, it } from "vitest";

import { validateCommentBody } from "@/lib/journey/comment-schema";

describe("validateCommentBody", () => {
  it("accepts a trimmed non-empty body", () => {
    const result = validateCommentBody({ body: "  Nice one!  " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toBe("Nice one!");
    }
  });

  it("rejects an empty body", () => {
    const result = validateCommentBody({ body: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation.comment.body");
    }
  });

  it("rejects an over-long body", () => {
    const result = validateCommentBody({ body: "x".repeat(2001) });
    expect(result.ok).toBe(false);
  });
});
