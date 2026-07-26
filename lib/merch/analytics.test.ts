import { describe, expect, it } from "vitest";

import {
  buildMerchAnalyticsSnapshot,
  type MerchAnalyticsOrderRow,
} from "@/lib/merch/analytics";

function order(overrides: Partial<MerchAnalyticsOrderRow>): MerchAnalyticsOrderRow {
  return {
    currency: "eur",
    status: "paid",
    livemode: true,
    customer_total_minor: 3000,
    printful_total_cost_minor: 1200,
    platform_fee_minor: 180,
    creator_profit_minor: 1620,
    creator_profit_released_minor: 0,
    refund_status: "none",
    ...overrides,
  };
}

describe("buildMerchAnalyticsSnapshot", () => {
  it("aggregates live paid orders per currency", () => {
    const snap = buildMerchAnalyticsSnapshot([
      order({ currency: "eur", customer_total_minor: 3000, platform_fee_minor: 180, creator_profit_minor: 1620, printful_total_cost_minor: 1200 }),
      order({ currency: "eur", status: "shipped", customer_total_minor: 2500, platform_fee_minor: 150, creator_profit_minor: 1350, printful_total_cost_minor: 1000, creator_profit_released_minor: 1350 }),
    ]);
    expect(snap.livePaidOrders).toBe(2);
    const eur = snap.perCurrency.find((c) => c.currency === "eur")!;
    expect(eur.grossMerchandiseValueMinor).toBe(5500);
    expect(eur.platformFeeMinor).toBe(330);
    expect(eur.creatorEarningsMinor).toBe(2970);
    expect(eur.transferredMinor).toBe(1350);
    expect(eur.printfulCostMinor).toBe(2200);
  });

  it("excludes test-mode orders from money, counting them separately", () => {
    const snap = buildMerchAnalyticsSnapshot([
      order({ livemode: true, customer_total_minor: 3000 }),
      order({ livemode: false, customer_total_minor: 9999 }),
    ]);
    expect(snap.livePaidOrders).toBe(1);
    expect(snap.testModeOrders).toBe(1);
    expect(snap.perCurrency[0].grossMerchandiseValueMinor).toBe(3000);
  });

  it("never mixes currencies", () => {
    const snap = buildMerchAnalyticsSnapshot([
      order({ currency: "eur", customer_total_minor: 3000 }),
      order({ currency: "gbp", customer_total_minor: 2000 }),
    ]);
    expect(snap.perCurrency).toHaveLength(2);
    expect(snap.perCurrency.map((c) => c.currency).sort()).toEqual(["eur", "gbp"]);
  });

  it("does not count unpaid orders in GMV but tracks them by status", () => {
    const snap = buildMerchAnalyticsSnapshot([
      order({ status: "awaiting_payment", customer_total_minor: 5000 }),
      order({ status: "paid", customer_total_minor: 3000 }),
    ]);
    expect(snap.livePaidOrders).toBe(1);
    expect(snap.ordersByStatus.awaiting_payment).toBe(1);
    expect(snap.ordersByStatus.paid).toBe(1);
    expect(snap.perCurrency[0].grossMerchandiseValueMinor).toBe(3000);
  });

  it("reports refunded orders separately without netting GMV", () => {
    const snap = buildMerchAnalyticsSnapshot([
      order({ status: "refunded", refund_status: "refunded", customer_total_minor: 3000 }),
    ]);
    const eur = snap.perCurrency[0];
    expect(eur.grossMerchandiseValueMinor).toBe(3000);
    expect(eur.refundedOrders).toBe(1);
  });
});
