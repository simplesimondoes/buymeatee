import { describe, expect, it } from "vitest";

import {
  formatMinorAmount,
  isSupportedCurrency,
  isValidMinorAmount,
} from "@/lib/payments/currency";

describe("isSupportedCurrency", () => {
  it("accepts gbp and eur only", () => {
    expect(isSupportedCurrency("gbp")).toBe(true);
    expect(isSupportedCurrency("eur")).toBe(true);
    expect(isSupportedCurrency("usd")).toBe(false);
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

describe("formatMinorAmount", () => {
  it("formats pence and cents", () => {
    expect(formatMinorAmount(500, "gbp")).toBe("£5.00");
    expect(formatMinorAmount(554, "gbp")).toBe("£5.54");
    expect(formatMinorAmount(9, "eur")).toBe("€0.09");
    expect(formatMinorAmount(123456, "eur")).toBe("€1234.56");
    expect(formatMinorAmount(-250, "gbp")).toBe("-£2.50");
  });

  it("refuses non-integer amounts", () => {
    expect(() => formatMinorAmount(5.5, "gbp")).toThrow();
  });
});
