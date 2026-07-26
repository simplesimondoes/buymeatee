import { describe, expect, it } from "vitest";

import { milestonesCrossed } from "@/lib/journey/milestone";

describe("milestonesCrossed", () => {
  const target = 1000;

  it("returns the single threshold a small gift crosses", () => {
    // 24% -> 26%
    expect(milestonesCrossed(240, 260, target)).toEqual([25]);
  });

  it("returns every threshold a large gift crosses at once", () => {
    // 49% -> 76%
    expect(milestonesCrossed(490, 760, target)).toEqual([50, 75]);
  });

  it("crosses 100 only when the target is actually met", () => {
    expect(milestonesCrossed(900, 999, target)).toEqual([]);
    expect(milestonesCrossed(900, 1000, target)).toEqual([100]);
    // Over-target still just registers 100 once.
    expect(milestonesCrossed(1000, 2000, target)).toEqual([]);
  });

  it("returns nothing when progress does not advance a threshold", () => {
    expect(milestonesCrossed(260, 300, target)).toEqual([]); // both in 25..49
    expect(milestonesCrossed(500, 400, target)).toEqual([]); // refund (negative)
  });

  it("handles the first-gift case from zero", () => {
    expect(milestonesCrossed(0, 250, target)).toEqual([25]);
    expect(milestonesCrossed(0, 1000, target)).toEqual([25, 50, 75, 100]);
  });

  it("is inert for a non-positive target", () => {
    expect(milestonesCrossed(0, 500, 0)).toEqual([]);
  });
});
