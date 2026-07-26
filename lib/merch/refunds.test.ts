import { describe, expect, it } from "vitest";

import { computeRefundPlan } from "@/lib/merch/refunds";

describe("computeRefundPlan", () => {
  it("refunds the full customer total", () => {
    const plan = computeRefundPlan({
      customerTotalMinor: 3499,
      creatorProfitReleasedMinor: 0,
      transferStatus: "none",
    });
    expect(plan.refundAmountMinor).toBe(3499);
  });

  it("does NOT reverse a transfer that never went out", () => {
    const plan = computeRefundPlan({
      customerTotalMinor: 3499,
      creatorProfitReleasedMinor: 0,
      transferStatus: "pending",
    });
    expect(plan.reverseTransfer).toBe(false);
    expect(plan.reverseAmountMinor).toBe(0);
  });

  it("reverses the released profit when the creator was already paid", () => {
    const plan = computeRefundPlan({
      customerTotalMinor: 3499,
      creatorProfitReleasedMinor: 1080,
      transferStatus: "transferred",
    });
    expect(plan.reverseTransfer).toBe(true);
    expect(plan.reverseAmountMinor).toBe(1080);
  });

  it("does not reverse when transfer is already reversed", () => {
    const plan = computeRefundPlan({
      customerTotalMinor: 3499,
      creatorProfitReleasedMinor: 1080,
      transferStatus: "reversed",
    });
    expect(plan.reverseTransfer).toBe(false);
  });
});
