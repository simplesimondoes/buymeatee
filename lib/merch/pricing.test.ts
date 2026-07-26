import { describe, expect, it } from "vitest";

import {
  calculateMerchPricing,
  minimumRetailUnitPriceMinor,
  MERCH_PRICING_VERSION,
  type MerchPricingConfig,
} from "@/lib/merch/pricing";

/** A test config with the spec default 10% fee, no floor, £1 minimum profit. */
const config: MerchPricingConfig = {
  pricingVersion: MERCH_PRICING_VERSION,
  platformFeeBps: 1000,
  minimumPlatformFee: {
    gbp: 0,
    eur: 0,
    usd: 0,
    cad: 0,
    aud: 0,
    nzd: 0,
    chf: 0,
    sek: 0,
    nok: 0,
    dkk: 0,
  },
  minimumCreatorProfit: {
    gbp: 100,
    eur: 100,
    usd: 100,
    cad: 100,
    aud: 100,
    nzd: 100,
    chf: 100,
    sek: 1000,
    nok: 1000,
    dkk: 1000,
  },
};

function ok(result: ReturnType<typeof calculateMerchPricing>) {
  if (!result.ok) {
    throw new Error(`expected ok, got error "${result.error}"`);
  }
  return result.breakdown;
}

describe("calculateMerchPricing", () => {
  it("matches the worked example: £30 retail, £18 cost -> £1.20 fee, £10.80 profit", () => {
    const b = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 3000,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    );
    expect(b.merchandiseSubtotalMinor).toBe(3000);
    expect(b.printfulProductCostMinor).toBe(1800);
    expect(b.preFeeCreatorMarginMinor).toBe(1200);
    expect(b.platformFeeMinor).toBe(120);
    expect(b.creatorProfitMinor).toBe(1080);
    expect(b.customerTotalMinor).toBe(3000);
    expect(b.pricingVersion).toBe(MERCH_PRICING_VERSION);
  });

  it("keeps fee + creator profit equal to the pre-fee margin (identity)", () => {
    const b = ok(
      calculateMerchPricing(
        {
          currency: "eur",
          retailUnitPriceMinor: 2599,
          quantity: 1,
          printfulUnitCostMinor: 1499,
        },
        config,
      ),
    );
    expect(b.platformFeeMinor + b.creatorProfitMinor).toBe(
      b.preFeeCreatorMarginMinor,
    );
  });

  it("scales subtotal and Printful cost by quantity", () => {
    const b = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 3000,
          quantity: 3,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    );
    expect(b.merchandiseSubtotalMinor).toBe(9000);
    expect(b.printfulProductCostMinor).toBe(5400);
    expect(b.preFeeCreatorMarginMinor).toBe(3600);
    expect(b.platformFeeMinor).toBe(360);
    expect(b.creatorProfitMinor).toBe(3240);
  });

  it("does NOT count shipping or tax as creator profit", () => {
    const withShipping = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 3000,
          quantity: 1,
          printfulUnitCostMinor: 1800,
          shippingChargedMinor: 499,
          taxChargedMinor: 600,
          printfulShippingCostMinor: 450,
          printfulTaxCostMinor: 600,
        },
        config,
      ),
    );
    // Creator profit is identical to the no-shipping case.
    expect(withShipping.creatorProfitMinor).toBe(1080);
    expect(withShipping.platformFeeMinor).toBe(120);
    expect(withShipping.preFeeCreatorMarginMinor).toBe(1200);
    // Customer total and Printful total include shipping + tax.
    expect(withShipping.customerTotalMinor).toBe(3000 + 499 + 600);
    expect(withShipping.printfulTotalCostMinor).toBe(1800 + 450 + 600);
    expect(withShipping.shippingChargedMinor).toBe(499);
    expect(withShipping.taxChargedMinor).toBe(600);
  });

  it("rounds the percentage fee half up", () => {
    // Margin 1205 * 10% = 120.5 -> 121 (half up).
    const b = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 3005,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    );
    expect(b.preFeeCreatorMarginMinor).toBe(1205);
    expect(b.platformFeeMinor).toBe(121);
    expect(b.creatorProfitMinor).toBe(1084);
  });

  it("applies a per-currency minimum platform fee floor", () => {
    const floored: MerchPricingConfig = {
      ...config,
      minimumPlatformFee: { ...config.minimumPlatformFee, gbp: 200 },
      minimumCreatorProfit: { ...config.minimumCreatorProfit, gbp: 0 },
    };
    // Margin 1000, 10% = 100, but floor is 200.
    const b = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 2800,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        floored,
      ),
    );
    expect(b.platformFeeMinor).toBe(200);
    expect(b.creatorProfitMinor).toBe(800);
  });

  it("never lets the platform fee exceed the margin (profit stays >= 0)", () => {
    const bigFloor: MerchPricingConfig = {
      ...config,
      minimumPlatformFee: { ...config.minimumPlatformFee, gbp: 5000 },
      minimumCreatorProfit: { ...config.minimumCreatorProfit, gbp: 0 },
    };
    const b = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 2000,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        bigFloor,
      ),
    );
    // Margin is 200; fee is capped at 200; profit is 0.
    expect(b.platformFeeMinor).toBe(200);
    expect(b.creatorProfitMinor).toBe(0);
  });

  it("rejects a zero or negative margin", () => {
    expect(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 1800,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    ).toEqual({ ok: false, error: "non-positive-margin" });

    expect(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 1500,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    ).toEqual({ ok: false, error: "non-positive-margin" });
  });

  it("rejects a product below the minimum creator profit", () => {
    // Margin 100, fee 10, profit 90 < minimum 100.
    expect(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 1900,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    ).toEqual({ ok: false, error: "below-minimum-creator-profit" });
  });

  it("rejects unsupported currencies", () => {
    expect(
      calculateMerchPricing(
        {
          // @ts-expect-error deliberately invalid currency
          currency: "jpy",
          retailUnitPriceMinor: 3000,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    ).toEqual({ ok: false, error: "unsupported-currency" });
  });

  it("rejects invalid quantities", () => {
    for (const quantity of [0, -1, 1.5, 1001, Number.NaN]) {
      expect(
        calculateMerchPricing(
          {
            currency: "gbp",
            retailUnitPriceMinor: 3000,
            quantity,
            printfulUnitCostMinor: 1800,
          },
          config,
        ),
      ).toEqual({ ok: false, error: "invalid-quantity" });
    }
  });

  it("rejects non-integer or negative money inputs", () => {
    expect(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 30.5,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    ).toEqual({ ok: false, error: "invalid-amount" });

    expect(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: 3000,
          quantity: 1,
          printfulUnitCostMinor: -1,
        },
        config,
      ),
    ).toEqual({ ok: false, error: "invalid-amount" });
  });
});

describe("minimumRetailUnitPriceMinor", () => {
  it("returns a price that clears the minimum creator profit", () => {
    const min = minimumRetailUnitPriceMinor("gbp", 1800, config);
    const b = ok(
      calculateMerchPricing(
        {
          currency: "gbp",
          retailUnitPriceMinor: min,
          quantity: 1,
          printfulUnitCostMinor: 1800,
        },
        config,
      ),
    );
    expect(b.creatorProfitMinor).toBeGreaterThanOrEqual(100);
  });

  it("one minor unit below the minimum fails to clear the profit floor", () => {
    const min = minimumRetailUnitPriceMinor("gbp", 1800, config);
    const below = calculateMerchPricing(
      {
        currency: "gbp",
        retailUnitPriceMinor: min - 1,
        quantity: 1,
        printfulUnitCostMinor: 1800,
      },
      config,
    );
    const clears =
      below.ok && below.breakdown.creatorProfitMinor >= 100;
    expect(clears).toBe(false);
  });
});
