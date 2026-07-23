import { describe, expect, it } from "vitest";

import {
  canTransitionGoal,
  goalProgressPercent,
  isGoalStatus,
  isPubliclyVisible,
  MAX_ACTIVE_GOALS,
} from "@/lib/goals/types";

describe("isGoalStatus", () => {
  it("accepts every lifecycle status", () => {
    for (const status of ["draft", "active", "completed", "archived"]) {
      expect(isGoalStatus(status)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isGoalStatus("paid")).toBe(false);
    expect(isGoalStatus("")).toBe(false);
    expect(isGoalStatus(null)).toBe(false);
    expect(isGoalStatus(1)).toBe(false);
  });
});

describe("isPubliclyVisible", () => {
  it("shows active and completed goals only", () => {
    expect(isPubliclyVisible("active")).toBe(true);
    expect(isPubliclyVisible("completed")).toBe(true);
    expect(isPubliclyVisible("draft")).toBe(false);
    expect(isPubliclyVisible("archived")).toBe(false);
  });
});

describe("canTransitionGoal", () => {
  it("allows publishing a draft", () => {
    expect(canTransitionGoal("draft", "active")).toBe(true);
  });

  it("allows completing or unpublishing an active goal", () => {
    expect(canTransitionGoal("active", "completed")).toBe(true);
    expect(canTransitionGoal("active", "archived")).toBe(true);
    expect(canTransitionGoal("active", "draft")).toBe(true);
  });

  it("allows reopening a completed goal", () => {
    expect(canTransitionGoal("completed", "active")).toBe(true);
    expect(canTransitionGoal("completed", "archived")).toBe(true);
  });

  it("revives archived goals only through draft", () => {
    expect(canTransitionGoal("archived", "draft")).toBe(true);
    expect(canTransitionGoal("archived", "active")).toBe(false);
    expect(canTransitionGoal("archived", "completed")).toBe(false);
  });

  it("never completes a draft directly", () => {
    expect(canTransitionGoal("draft", "completed")).toBe(false);
  });

  it("rejects self-transitions", () => {
    expect(canTransitionGoal("active", "active")).toBe(false);
  });
});

describe("goalProgressPercent", () => {
  it("is zero before any verified support", () => {
    expect(goalProgressPercent(0, 100_000)).toBe(0);
  });

  it("floors partial progress to whole percents", () => {
    expect(goalProgressPercent(999, 100_000)).toBe(0);
    expect(goalProgressPercent(1_000, 100_000)).toBe(1);
    expect(goalProgressPercent(54_000, 100_000)).toBe(54);
  });

  it("caps at 100 for over-target goals", () => {
    expect(goalProgressPercent(150_000, 100_000)).toBe(100);
  });

  it("is defensive about broken inputs", () => {
    expect(goalProgressPercent(500, 0)).toBe(0);
    expect(goalProgressPercent(-1, 100)).toBe(0);
  });
});

describe("MAX_ACTIVE_GOALS", () => {
  it("matches the database trigger limit", () => {
    // enforce_active_goal_limit() in the creator_goals migration hardcodes 3.
    expect(MAX_ACTIVE_GOALS).toBe(3);
  });
});
