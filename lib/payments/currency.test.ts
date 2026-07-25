import { describe, expect, it } from "vitest";

import {
  formatMinorAmount,
  isSupportedCurrency,
  isValidMinorAmount,
} from "@/lib/payments/currency";

describe("isSupportedCurrency", () => {
  it("accepts the supported 2-decimal currencies", () => {
    for (const code of ["gbp", "eur", "usd", "cad", "aud", "nzd", "chf", "sek", "nok", "dkk"]) {
      expect(isSupportedCurrency(code)).toBe(true);
    }
  });

  it("rejects unsupported codes, casing, and non-strings", () => {
    expect(isSupportedCurrency("jpy")).toBe(false);
    expect(isSupportedCurrency("krw")).toBe(false);
    expect(isSupportedCurrency("GBP")).toBe(false);
    expect(isSupportedCurrency(5)).toBe(false);
    expect(isSupportedCurrency(null)).toBe(false);
  });
});

describe("isValidMinorAmount", () => {
  it("accepts safe integers only", () => {
    expect(isValidMinorAmount(500)).toBe(true);
    expect(isValidMinorAmount(0)).toBe(true);
    expect(isValidMinorAmount(5.5)).toBe(false);
    expect(isValidMinorAmount("500")).toBe(false);
    expect(isValidMinorAmount(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isValidMinorAmount(Number.NaN)).toBe(false);
  });
});

describe("formatMinorAmount (deprecated en shim over lib/i18n/format)", () => {
  it("formats pence and cents with en-GB conventions", () => {
    expect(formatMinorAmount(500, "gbp")).toBe("£5.00");
    expect(formatMinorAmount(554, "gbp")).toBe("£5.54");
    expect(formatMinorAmount(9, "eur")).toBe("€0.09");
    expect(formatMinorAmount(123456, "eur")).toBe("€1,234.56");
    expect(formatMinorAmount(-250, "gbp")).toBe("-£2.50");
  });

  it("uses en-GB currency symbols for the other currencies", () => {
    expect(formatMinorAmount(500, "usd")).toBe("US$5.00");
    expect(formatMinorAmount(500, "cad")).toBe("CA$5.00");
    expect(formatMinorAmount(500, "aud")).toBe("A$5.00");
    expect(formatMinorAmount(500, "nzd")).toBe("NZ$5.00");
    expect(formatMinorAmount(500, "chf")).toMatch(/^CHF\s5\.00$/);
    expect(formatMinorAmount(2500, "sek")).toMatch(/^SEK\s25\.00$/);
    expect(formatMinorAmount(2500, "nok")).toMatch(/^NOK\s25\.00$/);
    expect(formatMinorAmount(2500, "dkk")).toMatch(/^DKK\s25\.00$/);
  });

  it("refuses non-integer amounts", () => {
    expect(() => formatMinorAmount(5.5, "gbp")).toThrow();
  });
});
