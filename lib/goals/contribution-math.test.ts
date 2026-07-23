import { describe, expect, it } from "vitest";

import {
  goalReductionForRefund,
  goalRefundDelta,
} from "@/lib/goals/contribution-math";

// A £10.00 gift on a £11.05 total charge (fees on top).
const GIFT = 1000;
const TOTAL = 1105;

describe("goalReductionForRefund", () => {
  it("is zero before any refund", () => {
    expect(goalReductionForRefund(GIFT, TOTAL, 0)).toBe(0);
  });

  it("withdraws the whole credit on a full refund", () => {
    expect(goalReductionForRefund(GIFT, TOTAL, TOTAL)).toBe(GIFT);
  });

  it("withdraws proportionally (floored) on a partial refund", () => {
    // Half the charge refunded → half the gift credit, floored.
    expect(goalReductionForRefund(GIFT, TOTAL, 552)).toBe(
      Math.floor((GIFT * 552) / TOTAL),
    );
    expect(goalReductionForRefund(GIFT, TOTAL, 552)).toBeLessThan(GIFT);
  });

  it("never exceeds the gift amount even on over-refunds", () => {
    expect(goalReductionForRefund(GIFT, TOTAL, TOTAL + 500)).toBe(GIFT);
  });

  it("is defensive about broken inputs", () => {
    expect(goalReductionForRefund(0, TOTAL, 500)).toBe(0);
    expect(goalReductionForRefund(GIFT, 0, 500)).toBe(0);
    expect(goalReductionForRefund(GIFT, TOTAL, -5)).toBe(0);
  });
});

describe("goalRefundDelta", () => {
  it("returns the negative step between two cumulative refund states", () => {
    expect(goalRefundDelta(GIFT, TOTAL, 0, TOTAL)).toBe(-GIFT);
    const firstPartial = goalRefundDelta(GIFT, TOTAL, 0, 552);
    expect(firstPartial).toBeLessThan(0);
    // Second partial completes the refund; the two steps sum to the whole.
    const secondPartial = goalRefundDelta(GIFT, TOTAL, 552, TOTAL);
    expect(firstPartial + secondPartial).toBe(-GIFT);
  });

  it("is zero when the refund state hasn't advanced (replayed event)", () => {
    expect(goalRefundDelta(GIFT, TOTAL, 552, 552)).toBe(0);
    expect(goalRefundDelta(GIFT, TOTAL, TOTAL, TOTAL)).toBe(0);
  });

  it("never goes positive if refund state appears to move backwards", () => {
    expect(goalRefundDelta(GIFT, TOTAL, TOTAL, 552)).toBe(0);
  });
});
