import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FundProvider, useFund } from "@/components/wishlist/fund-context";
import { PublicWishlist } from "@/components/wishlist/public-wishlist";
import type { WishlistItemRow } from "@/lib/wishlist/types";

function item(overrides: Partial<WishlistItemRow> = {}): WishlistItemRow {
  return {
    id: "item-1",
    creator_id: "user-1",
    title: "A dozen tour balls",
    description: "The good ones.",
    image_url: null,
    currency: "gbp",
    price_amount: 4500,
    status: "active",
    funded_by_gift_id: null,
    funded_at: null,
    sort_order: 0,
    created_at: "2026-07-25T00:00:00Z",
    updated_at: "2026-07-25T00:00:00Z",
    ...overrides,
  };
}

const base = { creatorName: "Callum", currency: "gbp" as const, isOwner: false };

describe("PublicWishlist", () => {
  it("renders nothing for visitors when there are no items", () => {
    const { container } = render(
      <PublicWishlist available={[]} funded={[]} ready {...base} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the owner a setup CTA when the list is empty", () => {
    render(
      <PublicWishlist
        available={[]}
        funded={[]}
        ready
        creatorName="Callum"
        currency="gbp"
        isOwner
      />,
    );
    expect(
      screen.getByRole("link", { name: /add your first item/i }),
    ).toHaveAttribute("href", "/dashboard/wishlist");
  });

  it("shows an item's price and a Fund button when ready", () => {
    render(
      <PublicWishlist available={[item()]} funded={[]} ready {...base} />,
    );
    expect(screen.getByText(/£45\.00/)).toBeVisible();
    expect(screen.getByRole("button", { name: /fund this/i })).toBeVisible();
  });

  it("hides the Fund button when the creator can't receive Tees yet", () => {
    render(
      <PublicWishlist available={[item()]} funded={[]} ready={false} {...base} />,
    );
    expect(screen.getByText(/£45\.00/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /fund this/i })).toBeNull();
  });

  it("hides the Fund button for items in a different currency", () => {
    render(
      <PublicWishlist
        available={[item({ currency: "eur" })]}
        funded={[]}
        ready
        {...base}
      />,
    );
    expect(screen.queryByRole("button", { name: /fund this/i })).toBeNull();
  });

  it("selects the item in the fund context when Fund is clicked", () => {
    function Probe() {
      const { selected } = useFund();
      return <p>selected: {selected?.title ?? "none"}</p>;
    }
    render(
      <FundProvider>
        <PublicWishlist available={[item()]} funded={[]} ready {...base} />
        <Probe />
      </FundProvider>,
    );
    expect(screen.getByText(/selected: none/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /fund this/i }));
    expect(screen.getByText(/selected: A dozen tour balls/)).toBeVisible();
  });

  it("lists funded items as journey proof", () => {
    render(
      <PublicWishlist
        available={[]}
        funded={[item({ id: "done", status: "funded" })]}
        ready
        {...base}
      />,
    );
    expect(screen.getByText(/funded by supporters/i)).toBeVisible();
    expect(screen.getByText(/A dozen tour balls/)).toBeVisible();
  });
});
