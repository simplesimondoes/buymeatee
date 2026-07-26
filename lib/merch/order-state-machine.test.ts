import { describe, expect, it } from "vitest";

import {
  assertOrderTransition,
  canTransitionOrder,
  InvalidOrderTransitionError,
  isTerminalOrderStatus,
} from "@/lib/merch/order-state-machine";

describe("order state machine", () => {
  it("allows the happy-path lifecycle", () => {
    const path = [
      ["draft", "awaiting_payment"],
      ["awaiting_payment", "paid"],
      ["paid", "printful_submission_pending"],
      ["printful_submission_pending", "printful_draft_created"],
      ["printful_draft_created", "printful_confirmed"],
      ["printful_confirmed", "in_production"],
      ["in_production", "shipped"],
      ["shipped", "delivered"],
    ] as const;
    for (const [from, to] of path) {
      expect(canTransitionOrder(from, to)).toBe(true);
    }
  });

  it("forbids nonsensical transitions", () => {
    expect(canTransitionOrder("refunded", "shipped")).toBe(false);
    expect(canTransitionOrder("cancelled", "paid")).toBe(false);
    expect(canTransitionOrder("delivered", "in_production")).toBe(false);
    expect(canTransitionOrder("draft", "shipped")).toBe(false);
  });

  it("forbids a no-op self-transition", () => {
    expect(canTransitionOrder("paid", "paid")).toBe(false);
  });

  it("allows a dispute from paid and fulfilment states", () => {
    expect(canTransitionOrder("paid", "disputed")).toBe(true);
    expect(canTransitionOrder("shipped", "disputed")).toBe(true);
  });

  it("marks cancelled and refunded as terminal", () => {
    expect(isTerminalOrderStatus("cancelled")).toBe(true);
    expect(isTerminalOrderStatus("refunded")).toBe(true);
    expect(isTerminalOrderStatus("paid")).toBe(false);
  });

  it("assertOrderTransition throws on an invalid move", () => {
    expect(() => assertOrderTransition("refunded", "shipped")).toThrow(
      InvalidOrderTransitionError,
    );
    expect(() => assertOrderTransition("paid", "printful_submission_pending")).not.toThrow();
  });
});
