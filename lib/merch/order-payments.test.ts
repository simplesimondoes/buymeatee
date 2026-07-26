import { describe, expect, it } from "vitest";

import {
  computeMerchOrderMismatches,
  type MerchOrderPaymentFacts,
  type MerchPaymentIntentFacts,
} from "@/lib/merch/order-payments";

const order: MerchOrderPaymentFacts = {
  id: "order-1",
  currency: "gbp",
  customerTotalMinor: 3499,
  livemode: false,
  status: "awaiting_payment",
};

const pi: MerchPaymentIntentFacts = {
  livemode: false,
  amount: 3499,
  currency: "gbp",
  metadataOrderId: "order-1",
};

describe("computeMerchOrderMismatches", () => {
  it("returns no mismatches for a matching payment", () => {
    expect(computeMerchOrderMismatches(order, pi)).toEqual([]);
  });

  it("flags a livemode mismatch (test vs live)", () => {
    expect(computeMerchOrderMismatches(order, { ...pi, livemode: true })).toEqual([
      "livemode",
    ]);
  });

  it("flags an amount mismatch (never charge a different total)", () => {
    expect(computeMerchOrderMismatches(order, { ...pi, amount: 3500 })).toEqual([
      "amount",
    ]);
  });

  it("flags a currency mismatch case-insensitively but accepts GBP == gbp", () => {
    expect(computeMerchOrderMismatches(order, { ...pi, currency: "usd" })).toEqual([
      "currency",
    ]);
    expect(computeMerchOrderMismatches(order, { ...pi, currency: "GBP" })).toEqual([]);
  });

  it("flags an order-id mismatch when metadata points elsewhere", () => {
    expect(
      computeMerchOrderMismatches(order, { ...pi, metadataOrderId: "order-2" }),
    ).toEqual(["metadata_order_id"]);
  });

  it("tolerates missing order-id metadata (matched by PI id upstream)", () => {
    expect(
      computeMerchOrderMismatches(order, { ...pi, metadataOrderId: null }),
    ).toEqual([]);
  });

  it("accumulates multiple mismatches", () => {
    expect(
      computeMerchOrderMismatches(order, {
        livemode: true,
        amount: 1,
        currency: "usd",
        metadataOrderId: "other",
      }),
    ).toEqual(["livemode", "amount", "currency", "metadata_order_id"]);
  });
});
