import { describe, expect, it } from "vitest";

import {
  completedGoalShareText,
  GOAL_MILESTONES,
  goalShareText,
  pageShareText,
  reachedMilestone,
} from "@/lib/goals/share";

describe("reachedMilestone", () => {
  it("is null below the first threshold", () => {
    expect(reachedMilestone(0, 1000)).toBeNull();
    expect(reachedMilestone(249, 1000)).toBeNull();
  });

  it("returns the highest crossed threshold", () => {
    expect(reachedMilestone(250, 1000)).toBe(25);
    expect(reachedMilestone(500, 1000)).toBe(50);
    expect(reachedMilestone(749, 1000)).toBe(50);
    expect(reachedMilestone(750, 1000)).toBe(75);
  });

  it("only reaches 100 when the target is actually met", () => {
    expect(reachedMilestone(999, 1000)).toBe(75);
    expect(reachedMilestone(1000, 1000)).toBe(100);
    // Over-target still caps at 100 (honest percent is capped).
    expect(reachedMilestone(5000, 1000)).toBe(100);
  });

  it("handles a zero or invalid target safely", () => {
    expect(reachedMilestone(500, 0)).toBeNull();
  });
});

describe("pageShareText", () => {
  it("is first-person, on-brand and X-length safe", () => {
    const text = pageShareText();
    expect(text).toContain("BuyMeATee");
    expect(text).toContain("journey");
    // Leaves room for the appended URL within X's 280-char limit.
    expect(text.length).toBeLessThanOrEqual(200);
  });
});

describe("goalShareText", () => {
  it("celebrates a funded goal", () => {
    const text = goalShareText("Q-School entry fee", 42500, 42500);
    expect(text).toContain("funded");
    expect(text).toContain("Q-School entry fee");
  });

  it("reports honest progress at an in-progress milestone", () => {
    const text = goalShareText("Scotland links trip", 500, 1000);
    expect(text).toContain("50%");
    expect(text).toContain("Scotland links trip");
  });

  it("invites the first backers before any milestone", () => {
    const text = goalShareText("New clubs", 0, 1000);
    expect(text).toContain("New clubs");
    expect(text).toContain("Support the journey");
    // No fabricated progress figure when there is none.
    expect(text).not.toMatch(/\d+%/);
  });

  it("truncates an over-long title", () => {
    const longTitle = "A".repeat(120);
    const text = goalShareText(longTitle, 500, 1000);
    expect(text).toContain("…");
    expect(text).not.toContain("A".repeat(120));
  });

  it("never uses off-brand fundraising vocabulary", () => {
    const samples = [
      pageShareText(),
      goalShareText("Goal", 0, 1000),
      goalShareText("Goal", 500, 1000),
      goalShareText("Goal", 1000, 1000),
      completedGoalShareText("Goal"),
    ];
    for (const text of samples) {
      expect(text.toLowerCase()).not.toContain("donat");
      expect(text.toLowerCase()).not.toContain("crowdfund");
    }
  });
});

describe("completedGoalShareText", () => {
  it("celebrates completion without asserting a funding level", () => {
    const text = completedGoalShareText("Regional qualifier travel");
    expect(text).toContain("Regional qualifier travel");
    expect(text).toContain("reached");
    expect(text).not.toMatch(/\d+%/);
    expect(text).not.toContain("funded");
  });
});

describe("GOAL_MILESTONES", () => {
  it("is the expected ascending set", () => {
    expect([...GOAL_MILESTONES]).toEqual([25, 50, 75, 100]);
  });
});
