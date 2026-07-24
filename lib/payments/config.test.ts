import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defaultCurrencyForCountry,
  getAllowedConnectCountries,
  getFeeConfig,
  getStripeUrls,
  PRESET_GIFT_AMOUNTS,
} from "@/lib/payments/config";
import { SUPPORTED_CURRENCIES } from "@/lib/payments/currency";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getFeeConfig", () => {
  it("provides the documented defaults", () => {
    const config = getFeeConfig();
    expect(config.platformFeeBps).toBe(500);
    expect(config.paymentFeeBps).toBe(150);
    expect(config.paymentFeeFixed.gbp).toBe(20);
    expect(config.paymentFeeFixed.eur).toBe(25);
    expect(config.paymentFeeFixed.usd).toBe(30);
    expect(config.paymentFeeFixed.sek).toBe(180);
    expect(config.minimumGift.gbp).toBe(100);
    expect(config.minimumGift.sek).toBe(1000);
    expect(config.maximumGift.gbp).toBe(50_000);
    expect(config.maximumGift.dkk).toBe(500_000);
    expect(config.feeModelVersion).toMatch(/^\d{4}-\d{2}-v\d+$/);
  });

  it("covers every supported currency in each amount record", () => {
    const config = getFeeConfig();
    for (const currency of SUPPORTED_CURRENCIES) {
      expect(config.paymentFeeFixed[currency]).toBeTypeOf("number");
      expect(config.minimumGift[currency]).toBeGreaterThan(0);
      expect(config.maximumGift[currency]).toBeGreaterThan(
        config.minimumGift[currency],
      );
      expect(PRESET_GIFT_AMOUNTS[currency].length).toBeGreaterThan(0);
    }
  });

  it("parses percent env values as basis points via string arithmetic", () => {
    vi.stubEnv("STRIPE_PAYMENT_FEE_PERCENT", "2.9");
    expect(getFeeConfig().paymentFeeBps).toBe(290);
    vi.stubEnv("STRIPE_PAYMENT_FEE_PERCENT", "2");
    expect(getFeeConfig().paymentFeeBps).toBe(200);
    vi.stubEnv("STRIPE_PAYMENT_FEE_PERCENT", "0.25");
    expect(getFeeConfig().paymentFeeBps).toBe(25);
  });

  it("rejects malformed percent values", () => {
    vi.stubEnv("STRIPE_PAYMENT_FEE_PERCENT", "1.5%");
    expect(() => getFeeConfig()).toThrow();
    vi.stubEnv("STRIPE_PAYMENT_FEE_PERCENT", "-1");
    expect(() => getFeeConfig()).toThrow();
    vi.stubEnv("STRIPE_PAYMENT_FEE_PERCENT", "1.555");
    expect(() => getFeeConfig()).toThrow();
  });

  it("rejects malformed integer values", () => {
    vi.stubEnv("STRIPE_MINIMUM_GIFT_GBP", "1.5");
    expect(() => getFeeConfig()).toThrow();
    vi.stubEnv("STRIPE_MINIMUM_GIFT_GBP", "-100");
    expect(() => getFeeConfig()).toThrow();
  });

  it("rejects fee rates of 100% or more", () => {
    vi.stubEnv("STRIPE_PLATFORM_FEE_BPS", "10000");
    expect(() => getFeeConfig()).toThrow();
  });

  it("honours configured minimums and maximums", () => {
    vi.stubEnv("STRIPE_MINIMUM_GIFT_GBP", "250");
    vi.stubEnv("STRIPE_MAXIMUM_GIFT_EUR", "10000");
    const config = getFeeConfig();
    expect(config.minimumGift.gbp).toBe(250);
    expect(config.maximumGift.eur).toBe(10_000);
  });
});

describe("getAllowedConnectCountries", () => {
  it("defaults to the full supported set", () => {
    const list = getAllowedConnectCountries();
    expect(list).toContain("GB");
    expect(list).toContain("IE");
    expect(list).toContain("US");
    expect(list).toContain("SE");
  });

  it("parses and sanitises the override", () => {
    vi.stubEnv("STRIPE_CONNECT_ALLOWED_COUNTRIES", "gb, ie,zz1");
    expect(getAllowedConnectCountries()).toEqual(["GB", "IE"]);
  });
});

describe("defaultCurrencyForCountry", () => {
  it("maps each country to its settlement currency", () => {
    expect(defaultCurrencyForCountry("GB")).toBe("gbp");
    expect(defaultCurrencyForCountry("IE")).toBe("eur");
    expect(defaultCurrencyForCountry("US")).toBe("usd");
    expect(defaultCurrencyForCountry("CH")).toBe("chf");
    expect(defaultCurrencyForCountry("SE")).toBe("sek");
  });

  it("falls back to gbp for unknown countries", () => {
    expect(defaultCurrencyForCountry("ZZ")).toBe("gbp");
  });
});

describe("getStripeUrls", () => {
  it("derives same-origin defaults from the site URL", () => {
    const urls = getStripeUrls();
    expect(urls.connectReturnUrl).toBe(
      "https://buymeatee.com/settings/payments/return",
    );
    expect(urls.checkoutSuccessUrl).toContain("{GIFT_PUBLIC_ID}");
  });

  it("rejects off-origin overrides (no open redirects)", () => {
    vi.stubEnv("STRIPE_CONNECT_RETURN_URL", "https://evil.example/return");
    expect(() => getStripeUrls()).toThrow();
  });

  it("accepts same-origin overrides", () => {
    vi.stubEnv(
      "STRIPE_CONNECT_RETURN_URL",
      "https://buymeatee.com/custom/return",
    );
    expect(getStripeUrls().connectReturnUrl).toBe(
      "https://buymeatee.com/custom/return",
    );
  });
});
