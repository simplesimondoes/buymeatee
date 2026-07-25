import { describe, expect, it } from "vitest";

import {
  canTransitionWishlistItem,
  isFunded,
  isPubliclyVisible,
  isWishlistItemStatus,
  WISHLIST_ITEM_STATUSES,
  type WishlistItemStatus,
} from "@/lib/wishlist/types";

describe("isWishlistItemStatus", () => {
  it("accepts every lifecycle status", () => {
    for (const status of ["draft", "active", "funded", "archived"]) {
      expect(isWishlistItemStatus(status)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isWishlistItemStatus("completed")).toBe(false);
    expect(isWishlistItemStatus("")).toBe(false);
    expect(isWishlistItemStatus(null)).toBe(false);
    expect(isWishlistItemStatus(2)).toBe(false);
  });
});

describe("isPubliclyVisible", () => {
  it("shows active and funded items only", () => {
    expect(isPubliclyVisible("active")).toBe(true);
    expect(isPubliclyVisible("funded")).toBe(true);
    expect(isPubliclyVisible("draft")).toBe(false);
    expect(isPubliclyVisible("archived")).toBe(false);
  });
});

describe("isFunded", () => {
  it("is true only for funded items", () => {
    expect(isFunded({ status: "funded" })).toBe(true);
    expect(isFunded({ status: "active" })).toBe(false);
  });
});

describe("canTransitionWishlistItem", () => {
  it("allows publishing a draft and taking it back off", () => {
    expect(canTransitionWishlistItem("draft", "active")).toBe(true);
    expect(canTransitionWishlistItem("active", "draft")).toBe(true);
  });

  it("allows archiving from any non-archived state", () => {
    expect(canTransitionWishlistItem("draft", "archived")).toBe(true);
    expect(canTransitionWishlistItem("active", "archived")).toBe(true);
    expect(canTransitionWishlistItem("funded", "archived")).toBe(true);
  });

  it("revives archived items only through draft", () => {
    expect(canTransitionWishlistItem("archived", "draft")).toBe(true);
    expect(canTransitionWishlistItem("archived", "active")).toBe(false);
  });

  it("NEVER lets a creator drive an item into 'funded' — only payment does", () => {
    for (const from of WISHLIST_ITEM_STATUSES) {
      expect(canTransitionWishlistItem(from as WishlistItemStatus, "funded")).toBe(
        false,
      );
    }
  });

  it("does not let a funded item be un-funded or re-published by hand", () => {
    expect(canTransitionWishlistItem("funded", "active")).toBe(false);
    expect(canTransitionWishlistItem("funded", "draft")).toBe(false);
  });

  it("rejects self-transitions", () => {
    expect(canTransitionWishlistItem("active", "active")).toBe(false);
  });
});
