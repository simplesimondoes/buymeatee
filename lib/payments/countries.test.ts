import { describe, expect, it } from "vitest";

import {
  CONNECT_COUNTRIES,
  countryFlagEmoji,
  countryName,
  defaultCurrencyForCountry,
} from "@/lib/payments/countries";
import { isSupportedCurrency } from "@/lib/payments/currency";

describe("countryFlagEmoji", () => {
  it("maps a code to regional-indicator symbols", () => {
    expect(countryFlagEmoji("GB")).toBe(String.fromCodePoint(0x1f1ec, 0x1f1e7));
    expect(countryFlagEmoji("us")).toBe(String.fromCodePoint(0x1f1fa, 0x1f1f8));
  });

  it("returns empty string for anything that isn't two letters", () => {
    expect(countryFlagEmoji("G1")).toBe("");
    expect(countryFlagEmoji("GBR")).toBe("");
    expect(countryFlagEmoji("")).toBe("");
  });
});

describe("CONNECT_COUNTRIES", () => {
  it("only references supported currencies", () => {
    for (const country of CONNECT_COUNTRIES) {
      expect(isSupportedCurrency(country.currency)).toBe(true);
    }
  });

  it("has unique, upper-case ISO alpha-2 codes", () => {
    const codes = CONNECT_COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe("countryName", () => {
  it("returns the display name, falling back to the code", () => {
    expect(countryName("GB")).toBe("United Kingdom");
    expect(countryName("ch")).toBe("Switzerland");
    expect(countryName("ZZ")).toBe("ZZ");
  });
});

describe("defaultCurrencyForCountry", () => {
  it("maps each country to its settlement currency", () => {
    expect(defaultCurrencyForCountry("GB")).toBe("gbp");
    expect(defaultCurrencyForCountry("IE")).toBe("eur");
    expect(defaultCurrencyForCountry("US")).toBe("usd");
    expect(defaultCurrencyForCountry("SE")).toBe("sek");
  });

  it("falls back to gbp for unknown codes", () => {
    expect(defaultCurrencyForCountry("ZZ")).toBe("gbp");
  });
});
