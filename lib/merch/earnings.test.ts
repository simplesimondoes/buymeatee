import { describe, expect, it } from "vitest";

import {
  bucketOrderEarnings,
  evaluateTransferEligibility,
  type TransferEligibilityInput,
} from "@/lib/merch/earnings";

const base: TransferEligibilityInput = {
  policy: "on_first_shipment",
  orderStatus: "shipped",
  transferStatus: "none",
  creatorProfitMinor: 1080,
  creatorProfitReleasedMinor: 0,
  connectedAccountReady: true,
};

describe("evaluateTransferEligibility", () => {
  it("is due on first shipment under the default policy", () => {
    expect(evaluateTransferEligibility(base)).toEqual({ due: true, amountMinor: 1080 });
  });

  it("is not due before the milestone", () => {
    expect(
      evaluateTransferEligibility({ ...base, orderStatus: "in_production" }),
    ).toMatchObject({ due: false, reason: "milestone-not-reached" });
  });

  it("respects on_fulfilment_started and on_printful_confirmation policies", () => {
    expect(
      evaluateTransferEligibility({
        ...base,
        policy: "on_fulfilment_started",
        orderStatus: "in_production",
      }).due,
    ).toBe(true);
    expect(
      evaluateTransferEligibility({
        ...base,
        policy: "on_printful_confirmation",
        orderStatus: "printful_confirmed",
      }).due,
    ).toBe(true);
  });

  it("never auto-releases under the manual policy", () => {
    expect(
      evaluateTransferEligibility({ ...base, policy: "manual" }),
    ).toMatchObject({ due: false, reason: "policy-manual" });
  });

  it("holds a disputed or refunded order", () => {
    expect(
      evaluateTransferEligibility({ ...base, orderStatus: "disputed" }),
    ).toMatchObject({ due: false, reason: "order-on-hold" });
    expect(
      evaluateTransferEligibility({ ...base, orderStatus: "refund_pending" }),
    ).toMatchObject({ due: false, reason: "order-on-hold" });
  });

  it("never transfers twice", () => {
    expect(
      evaluateTransferEligibility({ ...base, transferStatus: "transferred" }),
    ).toMatchObject({ due: false, reason: "already-transferred" });
  });

  it("refuses when the connected account is not ready", () => {
    expect(
      evaluateTransferEligibility({ ...base, connectedAccountReady: false }),
    ).toMatchObject({ due: false, reason: "connected-account-not-ready" });
  });

  it("refuses when there is no remaining profit", () => {
    expect(
      evaluateTransferEligibility({
        ...base,
        creatorProfitMinor: 1080,
        creatorProfitReleasedMinor: 1080,
      }),
    ).toMatchObject({ due: false, reason: "no-profit" });
  });
});

describe("bucketOrderEarnings", () => {
  it("buckets an approved (shipped, untransferred) order", () => {
    expect(
      bucketOrderEarnings({
        orderStatus: "shipped",
        transferStatus: "none",
        creatorProfitMinor: 1080,
        creatorProfitReleasedMinor: 0,
      }),
    ).toMatchObject({ approvedMinor: 1080, pendingMinor: 0 });
  });

  it("buckets a transferred order by the released amount", () => {
    expect(
      bucketOrderEarnings({
        orderStatus: "delivered",
        transferStatus: "transferred",
        creatorProfitMinor: 1080,
        creatorProfitReleasedMinor: 1080,
      }),
    ).toMatchObject({ transferredMinor: 1080 });
  });

  it("buckets a disputed order as pending (at risk)", () => {
    expect(
      bucketOrderEarnings({
        orderStatus: "disputed",
        transferStatus: "none",
        creatorProfitMinor: 1080,
        creatorProfitReleasedMinor: 0,
      }),
    ).toMatchObject({ pendingMinor: 1080 });
  });

  it("buckets a refunded order as refunded and a reversed transfer as reversed", () => {
    expect(
      bucketOrderEarnings({
        orderStatus: "refunded",
        transferStatus: "none",
        creatorProfitMinor: 1080,
        creatorProfitReleasedMinor: 0,
      }),
    ).toMatchObject({ refundedMinor: 1080 });
    expect(
      bucketOrderEarnings({
        orderStatus: "shipped",
        transferStatus: "reversed",
        creatorProfitMinor: 1080,
        creatorProfitReleasedMinor: 1080,
      }),
    ).toMatchObject({ reversedMinor: 1080 });
  });
});
