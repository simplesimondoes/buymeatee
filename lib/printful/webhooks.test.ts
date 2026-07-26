import { describe, expect, it } from "vitest";

import {
  parseWebhookPayload,
  verifyWebhookSecret,
} from "@/lib/printful/webhooks";

describe("verifyWebhookSecret", () => {
  it("accepts a matching secret", () => {
    expect(verifyWebhookSecret("s3cret", "s3cret")).toBe(true);
  });

  it("rejects a mismatch, wrong length, or missing secret", () => {
    expect(verifyWebhookSecret("nope", "s3cret")).toBe(false);
    expect(verifyWebhookSecret("s3cre", "s3cret")).toBe(false);
    expect(verifyWebhookSecret("s3cret", null)).toBe(false);
    expect(verifyWebhookSecret(null, "s3cret")).toBe(false);
    expect(verifyWebhookSecret("", "")).toBe(false);
  });
});

describe("parseWebhookPayload", () => {
  it("parses a package_shipped event with tracking", () => {
    const result = parseWebhookPayload(
      JSON.stringify({
        type: "package_shipped",
        created: 1_700_000_000,
        data: {
          order: { id: 555, external_id: "BMT-1", status: "fulfilled" },
          shipment: {
            id: 88,
            carrier: "USPS",
            service: "First Class",
            tracking_number: "TRK123",
            tracking_url: "https://track/TRK123",
            ship_date: "2026-07-25",
          },
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.kind).toBe("package_shipped");
    expect(result.event.externalId).toBe("BMT-1");
    expect(result.event.printfulOrderId).toBe(555);
    expect(result.event.shipment?.trackingNumber).toBe("TRK123");
    expect(result.event.externalEventId).toContain("package_shipped");
  });

  it("produces a stable, distinct dedup id per shipment", () => {
    const base = {
      type: "package_shipped",
      created: 1_700_000_000,
      data: { order: { id: 555, external_id: "BMT-1" } },
    };
    const a = parseWebhookPayload(
      JSON.stringify({ ...base, data: { ...base.data, shipment: { id: 1 } } }),
    );
    const a2 = parseWebhookPayload(
      JSON.stringify({ ...base, data: { ...base.data, shipment: { id: 1 } } }),
    );
    const b = parseWebhookPayload(
      JSON.stringify({ ...base, data: { ...base.data, shipment: { id: 2 } } }),
    );
    if (!a.ok || !a2.ok || !b.ok) throw new Error("expected ok");
    expect(a.event.externalEventId).toBe(a2.event.externalEventId);
    expect(a.event.externalEventId).not.toBe(b.event.externalEventId);
  });

  it("maps an order_failed event with a reason", () => {
    const result = parseWebhookPayload(
      JSON.stringify({
        type: "order_failed",
        created: 1,
        data: { order: { id: 9, external_id: "BMT-9" }, reason: "address invalid" },
      }),
    );
    if (!result.ok) throw new Error("expected ok");
    expect(result.event.kind).toBe("order_failed");
    expect(result.event.reason).toBe("address invalid");
  });

  it("classifies an unrecognised type as unknown but still parses", () => {
    const result = parseWebhookPayload(
      JSON.stringify({ type: "some_new_event", created: 1, data: {} }),
    );
    if (!result.ok) throw new Error("expected ok");
    expect(result.event.kind).toBe("unknown");
    expect(result.event.rawType).toBe("some_new_event");
  });

  it("rejects invalid JSON, missing type, and oversized payloads", () => {
    expect(parseWebhookPayload("{not json").ok).toBe(false);
    expect(parseWebhookPayload(JSON.stringify({ data: {} })).ok).toBe(false);
    expect(parseWebhookPayload(JSON.stringify({ type: "x" }), 4).ok).toBe(false);
  });
});
