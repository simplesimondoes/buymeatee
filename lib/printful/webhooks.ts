/**
 * Printful inbound webhook verification + parsing (ADR-024, spec §21).
 *
 * Printful API v1 does not HMAC-sign webhooks, so we use LAYERED protection: a
 * shared secret carried in the webhook URL (compared in constant time), strict
 * schema validation, a payload-size limit at the route, a derived stable event
 * id for deduplication, and status reconciliation via the Printful API in
 * lib/merch. This module is pure (no server-only) so it is fully unit-testable;
 * the secret is passed in by the route from getPrintfulWebhookSecret().
 */

export type PrintfulWebhookKind =
  | "package_shipped"
  | "package_returned"
  | "order_created"
  | "order_updated"
  | "order_failed"
  | "order_canceled"
  | "order_put_hold"
  | "order_refunded"
  | "unknown";

export interface PrintfulWebhookShipment {
  id: string;
  carrier: string | null;
  service: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shipDate: string | null;
}

export interface PrintfulWebhookEvent {
  kind: PrintfulWebhookKind;
  rawType: string;
  /** Stable id derived from the payload; used for idempotent processing. */
  externalEventId: string;
  /** BuyMeATee public order reference echoed by Printful, when present. */
  externalId: string | null;
  printfulOrderId: number | null;
  orderStatus: string | null;
  reason: string | null;
  shipment: PrintfulWebhookShipment | null;
}

export type PrintfulWebhookParseResult =
  | { ok: true; event: PrintfulWebhookEvent }
  | { ok: false; error: "invalid-json" | "invalid-shape" | "too-large" };

/** Constant-time string comparison to avoid leaking the secret via timing. */
export function verifyWebhookSecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  // Fail safe: with no configured secret we reject everything.
  if (!expected || !provided) {
    return false;
  }
  if (provided.length !== expected.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

const KNOWN_KINDS: Record<string, PrintfulWebhookKind> = {
  package_shipped: "package_shipped",
  package_returned: "package_returned",
  order_created: "order_created",
  order_updated: "order_updated",
  order_failed: "order_failed",
  order_canceled: "order_canceled",
  order_put_hold: "order_put_hold",
  order_refunded: "order_refunded",
};

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseShipment(value: unknown): PrintfulWebhookShipment | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const s = value as Record<string, unknown>;
  const id = s.id;
  return {
    id: typeof id === "number" || typeof id === "string" ? String(id) : "",
    carrier: str(s.carrier),
    service: str(s.service),
    trackingNumber: str(s.tracking_number),
    trackingUrl: str(s.tracking_url),
    shipDate: str(s.ship_date),
  };
}

/**
 * Parse and validate a raw Printful webhook body. `maxBytes` guards against
 * oversized payloads (the route should also cap the request). Returns a
 * normalised event with a stable `externalEventId` for dedup.
 */
export function parseWebhookPayload(
  rawBody: string,
  maxBytes = 256 * 1024,
): PrintfulWebhookParseResult {
  if (rawBody.length > maxBytes) {
    return { ok: false, error: "too-large" };
  }
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  if (typeof json !== "object" || json === null) {
    return { ok: false, error: "invalid-shape" };
  }
  const body = json as Record<string, unknown>;
  const rawType = str(body.type);
  if (!rawType) {
    return { ok: false, error: "invalid-shape" };
  }
  const data = (typeof body.data === "object" && body.data !== null
    ? (body.data as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const order = (typeof data.order === "object" && data.order !== null
    ? (data.order as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const externalId = str(order.external_id);
  const printfulOrderId = num(order.id);
  const orderStatus = str(order.status);
  const reason = str(data.reason) ?? str(body.reason);
  const shipment = parseShipment(data.shipment);
  const created = num(body.created);

  // Stable dedup id: type + order + shipment + created timestamp. Printful does
  // not send a unique event id, and the DB unique index (provider,
  // external_event_id) is the real guard against double-processing.
  const externalEventId = [
    rawType,
    printfulOrderId ?? externalId ?? "?",
    shipment?.id ?? shipment?.trackingNumber ?? "",
    created ?? "",
  ].join(":");

  return {
    ok: true,
    event: {
      kind: KNOWN_KINDS[rawType] ?? "unknown",
      rawType,
      externalEventId,
      externalId,
      printfulOrderId,
      orderStatus,
      reason,
      shipment,
    },
  };
}
