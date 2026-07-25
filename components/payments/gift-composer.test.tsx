import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GiftComposer } from "@/components/payments/gift-composer";
import {
  SupportTargetProvider,
  useSupportTarget,
} from "@/components/payments/support-target-context";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import type { FeeConfig } from "@/lib/payments/fees";

function record(value: number): Record<SupportedCurrency, number> {
  return Object.fromEntries(
    SUPPORTED_CURRENCIES.map((c) => [c, value]),
  ) as Record<SupportedCurrency, number>;
}

const feeConfig: FeeConfig = {
  feeModelVersion: "test",
  platformFeeBps: 500,
  paymentFeeBps: 150,
  paymentFeeFixed: record(20),
  minimumGift: record(100),
  maximumGift: record(50_000),
};

const GOAL_ID = "44444444-4444-4444-8444-444444444444";
const goal = {
  id: GOAL_ID,
  title: "Play every Open venue",
  raised: 62_000,
  target: 100_000,
};

function renderComposer(extra?: React.ReactNode) {
  return render(
    <SupportTargetProvider>
      <GiftComposer
        recipientUsername="james"
        recipientName="James"
        currency="gbp"
        presetAmounts={[300, 500, 1000, 2500]}
        feeConfig={feeConfig}
        goals={[goal]}
      />
      {extra}
    </SupportTargetProvider>,
  );
}

/** Test helper that funds a wish-list item through the context. */
function FundWishlistButton() {
  const { select } = useSupportTarget();
  return (
    <button
      type="button"
      onClick={() =>
        select({ kind: "wishlist", id: "w1", title: "New driver", priceAmount: 40_000 })
      }
    >
      set-wishlist
    </button>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GiftComposer target scoping", () => {
  it("defaults to general support and can switch to a goal via Change", () => {
    renderComposer();

    expect(screen.getByText(/General support for James/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(
      screen.getByRole("radio", { name: "Play every Open venue" }),
    );

    expect(screen.getByText("Play every Open venue")).toBeInTheDocument();
    expect(screen.getByText(/£620\.00 of £1000\.00 · 62%/)).toBeInTheDocument();
  });

  it("submits the chosen goal id to checkout", async () => {
    // Non-ok response avoids the success-path navigation (jsdom can't redefine
    // window.location.assign); the request body is captured on the call itself.
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "nope" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    renderComposer();
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(
      screen.getByRole("radio", { name: "Play every Open venue" }),
    );
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Sam" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /support this goal with stripe/i }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.goalId).toBe(GOAL_ID);
    expect(body.wishlistItemId).toBeUndefined();
  });

  it("locks the amount when funding a wish-list item", () => {
    renderComposer(<FundWishlistButton />);
    fireEvent.click(screen.getByRole("button", { name: "set-wishlist" }));

    expect(screen.getByText("You're funding")).toBeInTheDocument();
    expect(screen.getByText("New driver")).toBeInTheDocument();
    // The amount picker steps aside for outright funding.
    expect(screen.queryByText("Choose your Tee")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /choose a different amount/i }),
    );
    expect(screen.getByText("Choose your Tee")).toBeInTheDocument();
  });
});
