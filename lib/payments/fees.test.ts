import { describe, expect, it } from "vitest";

import { calculateFees, type FeeConfig } from "@/lib/payments/fees";

/** The documented default commercial assumptions (see lib/payments/config.ts). */
const config: FeeConfig = {
  feeModelVersion: "2026-07-v1",
  platformFeeBps: 500, // 5%
  paymentFeeBps: 150, // 1.5%
  paymentFeeFixed: { gbp: 20, eur: 25 },
  minimumGift: { gbp: 100, eur: 100 },
  maximumGift: { gbp: 50_000, eur: 50_000 },
};

describe("calculateFees", () => {
  it("calculates a GBP predefined amount (£5.00)", () => {
    const result = calculateFees(500, "gbp", config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const b = result.breakdown;
    expect(b.giftAmount).toBe(500);
    expect(b.platformFeeAmount).toBe(25); // 5% of 500
    // ceil((525 * 150 + 20 * 10000) / 9850) = ceil(28.30) = 29
    expect(b.paymentHandlingAmount).toBe(29);
    expect(b.applicationFeeAmount).toBe(54);
    expect(b.totalChargeAmount).toBe(554);
    expect(b.recipientTargetAmount).toBe(500);
    expect(b.feeModelVersion).toBe("2026-07-v1");
  });

  it("calculates a EUR predefined amount (€10.00) with the EUR fixed fee", () => {
    const result = calculateFees(1000, "eur", config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const b = result.breakdown;
    expect(b.platformFeeAmount).toBe(50);
    // ceil((1050 * 150 + 25 * 10000) / 9850) = ceil(41.37) = 42
    expect(b.paymentHandlingAmount).toBe(42);
    expect(b.totalChargeAmount).toBe(1092);
    expect(b.recipientTargetAmount).toBe(1000);
  });

  it("handles custom amounts and rounds the platform fee half-up", () => {
    // 4.99 → 5% = 24.95 → 25
    const result = calculateFees(499, "gbp", config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.breakdown.platformFeeAmount).toBe(25);
  });

  it("rounds the platform fee down below the midpoint", () => {
    // 1.09 → 5% = 5.45 → 5
    const result = calculateFees(109, "gbp", config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.breakdown.platformFeeAmount).toBe(5);
  });

  it("always books the recipient target equal to the gift", () => {
    for (const amount of [100, 137, 499, 500, 1234, 9_999, 50_000]) {
      for (const currency of ["gbp", "eur"] as const) {
        const result = calculateFees(amount, currency, config);
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        expect(result.breakdown.recipientTargetAmount).toBe(amount);
        expect(result.breakdown.totalChargeAmount).toBe(
          result.breakdown.giftAmount +
            result.breakdown.platformFeeAmount +
            result.breakdown.paymentHandlingAmount,
        );
        expect(result.breakdown.applicationFeeAmount).toBe(
          result.breakdown.platformFeeAmount +
            result.breakdown.paymentHandlingAmount,
        );
      }
    }
  });

  it("grosses up payment handling so the assumed processing fee never exceeds it", () => {
    for (const amount of [100, 250, 777, 5_000, 50_000]) {
      const result = calculateFees(amount, "gbp", config);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const total = result.breakdown.totalChargeAmount;
      // Assumed Stripe charge on the total (rounded up pessimistically).
      const assumedProcessing = Math.ceil((total * 150) / 10_000) + 20;
      expect(result.breakdown.paymentHandlingAmount).toBeGreaterThanOrEqual(
        assumedProcessing - 1, // integer gross-up is within a penny
      );
    }
  });

  it("uses the fixed-fee component per currency", () => {
    const gbp = calculateFees(500, "gbp", config);
    const eur = calculateFees(500, "eur", config);
    if (!gbp.ok || !eur.ok) throw new Error("expected ok");
    expect(eur.breakdown.paymentHandlingAmount).toBeGreaterThan(
      gbp.breakdown.paymentHandlingAmount,
    );
  });

  it("accepts the exact minimum and maximum", () => {
    expect(calculateFees(100, "gbp", config).ok).toBe(true);
    expect(calculateFees(50_000, "gbp", config).ok).toBe(true);
  });

  it("rejects amounts below the minimum", () => {
    const result = calculateFees(99, "gbp", config);
    expect(result).toEqual({ ok: false, error: "below-minimum" });
  });

  it("rejects amounts above the maximum", () => {
    const result = calculateFees(50_001, "eur", config);
    expect(result).toEqual({ ok: false, error: "above-maximum" });
  });

  it("rejects zero and negative amounts", () => {
    expect(calculateFees(0, "gbp", config)).toEqual({
      ok: false,
      error: "invalid-amount",
    });
    expect(calculateFees(-500, "gbp", config)).toEqual({
      ok: false,
      error: "invalid-amount",
    });
  });

  it("rejects unsafe and non-integer amounts", () => {
    expect(calculateFees(5.5, "gbp", config)).toEqual({
      ok: false,
      error: "invalid-amount",
    });
    expect(calculateFees(Number.MAX_SAFE_INTEGER + 1, "gbp", config)).toEqual({
      ok: false,
      error: "invalid-amount",
    });
    expect(calculateFees("500", "gbp", config)).toEqual({
      ok: false,
      error: "invalid-amount",
    });
    expect(calculateFees(Number.NaN, "gbp", config)).toEqual({
      ok: false,
      error: "invalid-amount",
    });
  });

  it("rejects very large amounts via the configured maximum", () => {
    expect(calculateFees(10_000_000, "gbp", config)).toEqual({
      ok: false,
      error: "above-maximum",
    });
  });

  it("rejects unsupported currencies", () => {
    expect(calculateFees(500, "usd", config)).toEqual({
      ok: false,
      error: "unsupported-currency",
    });
    expect(calculateFees(500, undefined, config)).toEqual({
      ok: false,
      error: "unsupported-currency",
    });
  });

  it("supports a zero-fee configuration without rounding artefacts", () => {
    const free: FeeConfig = {
      ...config,
      platformFeeBps: 0,
      paymentFeeBps: 0,
      paymentFeeFixed: { gbp: 0, eur: 0 },
    };
    const result = calculateFees(500, "gbp", free);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.breakdown.totalChargeAmount).toBe(500);
    expect(result.breakdown.applicationFeeAmount).toBe(0);
  });

  it("stamps the fee model version onto every breakdown", () => {
    const versioned = calculateFees(500, "gbp", {
      ...config,
      feeModelVersion: "2027-01-v2",
    });
    if (!versioned.ok) throw new Error("expected ok");
    expect(versioned.breakdown.feeModelVersion).toBe("2027-01-v2");
  });
});
