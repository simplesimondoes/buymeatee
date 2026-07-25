import { describe, expect, it } from "vitest";

import { validateGoalInput } from "@/lib/goals/goal-schema";
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TARGET_MAX_MINOR,
  GOAL_TITLE_MAX_LENGTH,
} from "@/lib/goals/types";

const valid = {
  title: "Scotland links trip",
  description: "Green fees and travel for a week of filming.",
  currency: "gbp",
  targetAmount: 100_000,
};

describe("validateGoalInput", () => {
  it("accepts a complete goal and trims text fields", () => {
    const result = validateGoalInput({
      ...valid,
      title: "  Scotland links trip  ",
      description: "  Green fees and travel.  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("Scotland links trip");
      expect(result.data.description).toBe("Green fees and travel.");
      expect(result.data.targetAmount).toBe(100_000);
    }
  });

  it("treats description as optional and drops empty strings", () => {
    const result = validateGoalInput({ ...valid, description: "   " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("rejects a missing or oversize title with a coded error", () => {
    for (const title of ["", "   ", "x".repeat(GOAL_TITLE_MAX_LENGTH + 1)]) {
      const result = validateGoalInput({ ...valid, title });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.title).toEqual({
          code: "validation.goal.title",
          params: { max: GOAL_TITLE_MAX_LENGTH },
        });
      }
    }
  });

  it("rejects an oversize description with a coded error", () => {
    const result = validateGoalInput({
      ...valid,
      description: "x".repeat(GOAL_DESCRIPTION_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.description).toEqual({
        code: "validation.goal.description",
        params: { max: GOAL_DESCRIPTION_MAX_LENGTH },
      });
    }
  });

  it("rejects unsupported currencies", () => {
    const result = validateGoalInput({ ...valid, currency: "jpy" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.currency).toEqual({
        code: "validation.goal.currency",
      });
    }
  });

  it("rejects non-integer, non-positive and over-cap targets", () => {
    for (const targetAmount of [0, -100, 10.5, GOAL_TARGET_MAX_MINOR + 1, "500", null]) {
      const result = validateGoalInput({ ...valid, targetAmount });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.targetAmount).toEqual({
          code: "validation.goal.targetAmount",
        });
      }
    }
  });

  it("reports every invalid field at once for non-object payloads", () => {
    const result = validateGoalInput(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title?.code).toBe("validation.goal.title");
      expect(result.errors.currency?.code).toBe("validation.goal.currency");
      expect(result.errors.targetAmount?.code).toBe(
        "validation.goal.targetAmount",
      );
    }
  });
});
