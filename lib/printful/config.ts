import "server-only";

/**
 * Printful API configuration (Printful merch MVP, ADR-024).
 *
 * One module owns every PRINTFUL_* tunable, read from the environment. Like the
 * rest of the platform, it FAILS SAFE: when the token is unset, isPrintfulConfigured()
 * is false and callers surface an honest "unavailable" state rather than
 * pretending. Secrets live here and in client.ts only, both server-only.
 */

const DEFAULT_BASE_URL = "https://api.printful.com";

export interface PrintfulConfig {
  apiToken: string;
  /** Optional — required only for account-level tokens serving multiple stores. */
  storeId: string | null;
  baseUrl: string;
  /** "draft": create orders unconfirmed (manual confirm). "auto": confirm on create. */
  orderMode: "draft" | "auto";
}

export function isPrintfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_TOKEN?.trim());
}

function readBaseUrl(): string {
  const raw = process.env.PRINTFUL_API_BASE_URL?.trim();
  if (!raw) {
    return DEFAULT_BASE_URL;
  }
  // Only https, and strip any trailing slash so path joins are predictable.
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid PRINTFUL_API_BASE_URL: not a URL ("${raw}").`);
  }
  if (url.protocol !== "https:") {
    throw new Error("PRINTFUL_API_BASE_URL must be https.");
  }
  return raw.replace(/\/$/, "");
}

function readOrderMode(): "draft" | "auto" {
  const raw = process.env.PRINTFUL_ORDER_MODE?.trim().toLowerCase();
  if (!raw || raw === "draft") {
    return "draft";
  }
  if (raw === "auto") {
    return "auto";
  }
  throw new Error(`Invalid PRINTFUL_ORDER_MODE: expected "draft" or "auto", got "${raw}".`);
}

/**
 * Return the resolved Printful config, or throw if the token is missing. Guard
 * with isPrintfulConfigured() first at any boundary that must fail safe.
 */
export function getPrintfulConfig(): PrintfulConfig {
  const apiToken = process.env.PRINTFUL_API_TOKEN?.trim();
  if (!apiToken) {
    throw new Error(
      "Printful is not configured: PRINTFUL_API_TOKEN is unset. Merch fulfilment is unavailable until it is set.",
    );
  }
  return {
    apiToken,
    storeId: process.env.PRINTFUL_STORE_ID?.trim() || null,
    baseUrl: readBaseUrl(),
    orderMode: readOrderMode(),
  };
}

/** The Printful secret used to verify inbound webhooks (spec §21). */
export function getPrintfulWebhookSecret(): string | null {
  return process.env.PRINTFUL_WEBHOOK_SECRET?.trim() || null;
}
