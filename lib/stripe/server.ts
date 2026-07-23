import "server-only";

import Stripe from "stripe";

/**
 * The single server-side Stripe client (ADR-009).
 *
 * Uses the SDK's pinned API version. The secret key never leaves trusted
 * server code; nothing in components/ or client bundles may import this
 * module (enforced by "server-only").
 */

let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (cachedClient) {
    return cachedClient;
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Payments are unavailable until it is set.",
    );
  }
  cachedClient = new Stripe(secretKey, {
    appInfo: { name: "BuyMeATee", url: "https://buymeatee.com" },
  });
  return cachedClient;
}

/** Whether the configured key operates in live mode. Gifts and webhook events record this. */
export function isLivemode(): boolean {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  return secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}
