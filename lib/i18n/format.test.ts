import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatMinorAmount,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "./format";

describe("formatMinorAmount", () => {
  it("formats GBP for English (en-GB presentation)", () => {
    expect(formatMinorAmount(500, "gbp", "en")).toBe("£5.00");
    expect(formatMinorAmount(123456, "gbp", "en")).toBe("£1,234.56");
  });

  it("formats EUR per locale conventions", () => {
    // German: comma decimal, trailing symbol (CLDR groups from 5 digits).
    expect(formatMinorAmount(12345678, "eur", "de")).toMatch(
      /^123\.456,78\s?€$/,
    );
    // French: narrow-nbsp grouping, trailing symbol.
    expect(formatMinorAmount(12345678, "eur", "fr")).toMatch(
      /^123\s456,78\s?€$/u,
    );
    // Italian: dot grouping, comma decimal.
    expect(formatMinorAmount(12345678, "eur", "it")).toMatch(
      /^123\.456,78\s?€$/,
    );
  });

  it("formats for Japanese and Korean locales", () => {
    expect(formatMinorAmount(123456, "eur", "ja")).toContain("€");
    expect(formatMinorAmount(123456, "eur", "ja")).toContain("1,234.56");
    expect(formatMinorAmount(123456, "usd", "ko")).toContain("1,234.56");
  });

  it("handles negative amounts", () => {
    expect(formatMinorAmount(-500, "gbp", "en")).toBe("-£5.00");
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatMinorAmount(5.5, "gbp", "en")).toThrow(
      "integer minor units",
    );
  });
});

describe("formatDate", () => {
  const date = new Date("2026-07-24T12:00:00Z");
  it("formats per locale", () => {
    expect(formatDate(date, "en")).toBe("24 July 2026");
    expect(formatDate(date, "de")).toBe("24. Juli 2026");
    expect(formatDate(date, "ja")).toBe("2026年7月24日");
    expect(formatDate(date, "ko")).toBe("2026년 7월 24일");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-25T12:00:00Z");
  it("formats past times per locale", () => {
    expect(formatRelativeTime(new Date("2026-07-22T12:00:00Z"), "en", now)).toBe(
      "3 days ago",
    );
    expect(formatRelativeTime(new Date("2026-07-22T12:00:00Z"), "de", now)).toBe(
      "vor 3 Tagen",
    );
  });
});

describe("formatNumber / formatPercent", () => {
  it("uses locale grouping", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
    expect(formatNumber(1234567, "de")).toBe("1.234.567");
  });
  it("formats percentages", () => {
    expect(formatPercent(45, "en")).toBe("45%");
    expect(formatPercent(45, "de")).toMatch(/^45\s?%$/);
  });
});
