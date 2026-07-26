import { describe, expect, it } from "vitest";

import { PrintfulError } from "@/lib/printful/errors";
import {
  parseMajorDecimalToMinor,
  parseMockupTask,
  parseOrder,
  parseShippingRates,
} from "@/lib/printful/schemas";

describe("parseMajorDecimalToMinor", () => {
  it("converts decimal money strings to minor units without floats", () => {
    expect(parseMajorDecimalToMinor("18.00", "x")).toBe(1800);
    expect(parseMajorDecimalToMinor("5", "x")).toBe(500);
    expect(parseMajorDecimalToMinor("12.5", "x")).toBe(1250);
    expect(parseMajorDecimalToMinor("0.09", "x")).toBe(9);
    expect(parseMajorDecimalToMinor(7, "x")).toBe(700);
  });

  it("rejects malformed money strings", () => {
    expect(() => parseMajorDecimalToMinor("abc", "x")).toThrow(PrintfulError);
    expect(() => parseMajorDecimalToMinor("1.234", "x")).toThrow(PrintfulError);
  });
});

describe("parseOrder", () => {
  it("normalises costs and shipments", () => {
    const order = parseOrder({
      id: 42,
      external_id: "BMT-42",
      status: "fulfilled",
      shipping: "STANDARD",
      costs: { currency: "GBP", subtotal: "18.00", shipping: "4.99", tax: "0.00", total: "22.99" },
      shipments: [
        { id: 1, carrier: "Royal Mail", tracking_number: "RM1", tracking_url: "u" },
      ],
    });
    expect(order.id).toBe(42);
    expect(order.costs?.subtotalMinor).toBe(1800);
    expect(order.costs?.totalMinor).toBe(2299);
    expect(order.shipments[0].trackingNumber).toBe("RM1");
  });

  it("throws on a missing status", () => {
    expect(() => parseOrder({ id: 1 })).toThrow(PrintfulError);
  });
});

describe("parseMockupTask", () => {
  it("parses a completed task with mockups", () => {
    const task = parseMockupTask({
      task_key: "abc",
      status: "completed",
      mockups: [{ variant_ids: [1, 2], placement: "front", mockup_url: "https://m/1.png" }],
    });
    expect(task.status).toBe("completed");
    expect(task.mockups[0].mockupUrl).toBe("https://m/1.png");
  });

  it("treats an unknown status as pending", () => {
    expect(parseMockupTask({ task_key: "abc", status: "queued" }).status).toBe("pending");
  });
});

describe("parseShippingRates", () => {
  it("normalises rate money to minor units", () => {
    const rates = parseShippingRates([
      { id: "STANDARD", name: "Standard", rate: "4.99", currency: "GBP" },
    ]);
    expect(rates[0].rateMinor).toBe(499);
    expect(rates[0].id).toBe("STANDARD");
  });
});
