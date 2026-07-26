import { describe, expect, it } from "vitest";

import { MERCH_PRICING_VERSION, type MerchPricingConfig } from "@/lib/merch/pricing";
import { validateProductConfiguration } from "@/lib/merch/product-validation";
import type { CuratedProduct } from "@/lib/merch/types";

const pricingConfig: MerchPricingConfig = {
  pricingVersion: MERCH_PRICING_VERSION,
  platformFeeBps: 1000,
  minimumPlatformFee: {
    gbp: 0, eur: 0, usd: 0, cad: 0, aud: 0, nzd: 0, chf: 0, sek: 0, nok: 0, dkk: 0,
  },
  minimumCreatorProfit: {
    gbp: 100, eur: 100, usd: 100, cad: 100, aud: 100, nzd: 100, chf: 100,
    sek: 1000, nok: 1000, dkk: 1000,
  },
};

const curated: CuratedProduct = {
  id: "c1",
  printfulCatalogProductId: 71,
  slug: "unisex-tee",
  displayName: "Unisex T-shirt",
  description: null,
  category: "apparel",
  enabled: true,
  featured: false,
  sortOrder: 0,
  allowedVariantIds: [4011, 4012, 4013],
  allowedColours: ["black", "white"],
  allowedSizes: ["S", "M", "L"],
  allowedPlacements: ["front", "left_chest"],
  defaultPlacement: "front",
  supportedRegions: ["GB", "US"],
  currency: "gbp",
  minimumRetailPriceMinor: 2000,
  minimumCreatorProfitMinor: 100,
};

const validInput = {
  title: "My Tee",
  slug: "my-tee",
  currency: "gbp" as const,
  retailPriceMinor: 3000,
  selectedVariantIds: [4011, 4012],
  selectedColours: ["black"],
  selectedSizes: ["S", "M"],
  placement: "front",
};

describe("validateProductConfiguration", () => {
  it("accepts a valid configuration and returns the margin split", () => {
    const result = validateProductConfiguration(validInput, curated, pricingConfig, 1800);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.creatorProfitMinor).toBe(1080);
    expect(result.platformFeeMinor).toBe(120);
  });

  it("validates selections without the margin check when cost is unknown", () => {
    const result = validateProductConfiguration(validInput, curated, pricingConfig);
    expect(result.ok).toBe(true);
  });

  it("rejects a variant outside the curated allow-list", () => {
    const result = validateProductConfiguration(
      { ...validInput, selectedVariantIds: [9999] },
      curated,
      pricingConfig,
      1800,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain("variant-not-allowed");
  });

  it("rejects a colour, size or placement outside the allow-list", () => {
    const result = validateProductConfiguration(
      { ...validInput, selectedColours: ["red"], selectedSizes: ["XXL"], placement: "back" },
      curated,
      pricingConfig,
      1800,
    );
    if (result.ok) throw new Error("expected failure");
    expect(result.errors).toEqual(
      expect.arrayContaining(["colour-not-allowed", "size-not-allowed", "placement-not-allowed"]),
    );
  });

  it("rejects a price below the curated minimum", () => {
    const result = validateProductConfiguration(
      { ...validInput, retailPriceMinor: 1500 },
      curated,
      pricingConfig,
      1800,
    );
    if (result.ok) throw new Error("expected failure");
    expect(result.errors).toContain("below-minimum-price");
  });

  it("flags a too-thin margin as pricing-invalid", () => {
    // Retail 2000 (>= min price) but Printful cost 1950 -> margin 50, profit < 100.
    const result = validateProductConfiguration(
      { ...validInput, retailPriceMinor: 2000 },
      curated,
      pricingConfig,
      1950,
    );
    if (result.ok) throw new Error("expected failure");
    expect(result.errors).toContain("pricing-invalid");
  });

  it("rejects an invalid slug and empty title", () => {
    const result = validateProductConfiguration(
      { ...validInput, title: "  ", slug: "Not A Slug" },
      curated,
      pricingConfig,
    );
    if (result.ok) throw new Error("expected failure");
    expect(result.errors).toEqual(
      expect.arrayContaining(["title-required", "invalid-slug"]),
    );
  });
});
