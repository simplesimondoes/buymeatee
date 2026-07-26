import { describe, expect, it } from "vitest";

import { buildCuratedDraftFromPrintful } from "@/lib/merch/catalogue";
import type { PrintfulProductDetail } from "@/lib/printful/types";

const detail: PrintfulProductDetail = {
  product: {
    id: 71,
    type: "T-SHIRT",
    brand: "Bella",
    model: "3001",
    title: "Unisex Staple T-Shirt",
    description: "A soft tee.",
  },
  variants: [
    { id: 4011, productId: 71, name: "Black / S", size: "S", color: "Black", priceMinor: 1800, currency: "USD", inStock: true },
    { id: 4012, productId: 71, name: "Black / M", size: "M", color: "Black", priceMinor: 1800, currency: "USD", inStock: true },
    { id: 4013, productId: 71, name: "White / S", size: "S", color: "White", priceMinor: 1800, currency: "USD", inStock: true },
  ],
};

describe("buildCuratedDraftFromPrintful", () => {
  it("defaults allow-lists to everything the product offers and stays disabled", () => {
    const draft = buildCuratedDraftFromPrintful(detail, {
      slug: "unisex-staple-tee",
      currency: "gbp",
    });
    expect(draft.printful_catalog_product_id).toBe(71);
    expect(draft.slug).toBe("unisex-staple-tee");
    expect(draft.display_name).toBe("Unisex Staple T-Shirt");
    expect(draft.enabled).toBe(false);
    expect(draft.allowed_variant_ids).toEqual([4011, 4012, 4013]);
    expect(draft.allowed_colours).toEqual(["Black", "White"]);
    expect(draft.allowed_sizes).toEqual(["S", "M"]);
    expect(draft.currency).toBe("gbp");
  });

  it("honours admin overrides that prune the allow-lists", () => {
    const draft = buildCuratedDraftFromPrintful(detail, {
      slug: "black-only-tee",
      displayName: "Black Tee",
      currency: "gbp",
      allowedVariantIds: [4011, 4012],
      allowedColours: ["Black"],
      allowedSizes: ["S", "M"],
      allowedPlacements: ["front"],
      defaultPlacement: "front",
      minimumRetailPriceMinor: 2000,
      minimumCreatorProfitMinor: 100,
    });
    expect(draft.display_name).toBe("Black Tee");
    expect(draft.allowed_variant_ids).toEqual([4011, 4012]);
    expect(draft.allowed_colours).toEqual(["Black"]);
    expect(draft.allowed_placements).toEqual(["front"]);
    expect(draft.default_placement).toBe("front");
    expect(draft.minimum_retail_price_minor).toBe(2000);
  });
});
