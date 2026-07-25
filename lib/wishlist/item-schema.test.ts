import { describe, expect, it } from "vitest";

import { validateWishlistItemInput } from "@/lib/wishlist/item-schema";
import {
  WISHLIST_DESCRIPTION_MAX_LENGTH,
  WISHLIST_PRICE_MAX_MINOR,
  WISHLIST_TITLE_MAX_LENGTH,
} from "@/lib/wishlist/types";

const valid = {
  title: "A dozen tour balls",
  description: "The good ones, for tournament weeks.",
  currency: "gbp",
  priceAmount: 4500,
};

describe("validateWishlistItemInput", () => {
  it("accepts a complete valid payload", () => {
    const result = validateWishlistItemInput(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.title).toBe("A dozen tour balls");
    expect(result.data.priceAmount).toBe(4500);
    expect(result.data.currency).toBe("gbp");
  });

  it("trims the title and treats a blank description as omitted", () => {
    const result = validateWishlistItemInput({
      ...valid,
      title: "  New driver  ",
      description: "   ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.title).toBe("New driver");
    expect(result.data.description).toBeUndefined();
  });

  it("requires a title within length limits, with a coded error", () => {
    for (const title of ["", "x".repeat(121)]) {
      const result = validateWishlistItemInput({ ...valid, title });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.title).toEqual({
          code: "validation.wishlist.title",
          params: { max: WISHLIST_TITLE_MAX_LENGTH },
        });
      }
    }
  });

  it("enforces the description length limit with a coded error", () => {
    const result = validateWishlistItemInput({
      ...valid,
      description: "x".repeat(1001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.description).toEqual({
        code: "validation.wishlist.description",
        params: { max: WISHLIST_DESCRIPTION_MAX_LENGTH },
      });
    }
  });

  it("rejects unsupported currencies", () => {
    const result = validateWishlistItemInput({ ...valid, currency: "jpy" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.currency).toEqual({
        code: "validation.wishlist.currency",
      });
    }
  });

  it("rejects non-integer, zero, negative and over-cap prices", () => {
    for (const priceAmount of [
      0,
      -100,
      45.5,
      "4500",
      null,
      WISHLIST_PRICE_MAX_MINOR + 1,
    ]) {
      const result = validateWishlistItemInput({ ...valid, priceAmount });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.priceAmount).toEqual({
          code: "validation.wishlist.price",
        });
      }
    }
  });

  it("accepts a price exactly at the cap", () => {
    expect(
      validateWishlistItemInput({
        ...valid,
        priceAmount: WISHLIST_PRICE_MAX_MINOR,
      }).ok,
    ).toBe(true);
  });

  it("survives junk payloads", () => {
    expect(validateWishlistItemInput(null).ok).toBe(false);
    expect(validateWishlistItemInput("item").ok).toBe(false);
    expect(validateWishlistItemInput(undefined).ok).toBe(false);
  });
});
