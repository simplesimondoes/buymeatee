import "server-only";

import { getCuratedProductByIdInternal } from "@/lib/merch/catalogue";
import { getMerchPricingConfig, isMerchCheckoutLive } from "@/lib/merch/config";
import {
  calculateMerchPricing,
  type MerchPricingBreakdown,
} from "@/lib/merch/pricing";
import type { MerchProductRow } from "@/lib/merch/products";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import { canReceiveGifts } from "@/lib/payments/types";
import { isSupportedCurrency } from "@/lib/payments/currency";
import { getCatalogProduct } from "@/lib/printful/catalogue";
import { getPrintfulClientOrNull } from "@/lib/printful/client";
import { calculateShippingRates } from "@/lib/printful/shipping";
import type { PrintfulRecipient } from "@/lib/printful/types";
import { getStripeClient, isLivemode } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAppLocale } from "@/i18n/locales";
import { siteConfig } from "@/lib/site";

/**
 * Merchandise checkout (ADR-024, spec §16/§17).
 *
 * Creates an immutable quote + a pending order, then a Stripe-hosted Checkout
 * Session on the PLATFORM account using the SEPARATE charges + transfers model —
 * there is no transfer_data, so the platform collects the full customer total
 * and the creator's profit is transferred later (lib/merch/transfers.ts) only
 * when the release milestone is reached. The order is never marked paid here;
 * that only happens via the verified webhook (lib/merch/order-payments.ts).
 *
 * Fails safe: if checkout isn't live, Printful/Stripe/Connect aren't ready, or
 * the currency doesn't match the creator's payout currency, it returns a typed
 * error and creates nothing chargeable.
 *
 * MVP scope (spec §14/§38): one product, one variant, per checkout; tax is 0
 * (no tax model is invented — spec §23); shipping is pass-through (customer
 * pays Printful's shipping quote, which nets out of creator profit). The
 * Printful wholesale cost is read in the order currency; the beta runs a single
 * currency whose Printful store currency matches (documented setup step).
 */

export interface MerchCheckoutInput {
  creatorId: string;
  productId: string;
  /** The chosen colour + size — resolved to a Printful variant server-side. */
  colour: string;
  size: string;
  quantity: number;
  recipient: PrintfulRecipient;
  currency: string;
  buyerUserId?: string | null;
  buyerEmail?: string | null;
  /** UI locale for the Stripe Checkout page + return URLs. */
  locale?: string;
  /** Same-origin path to return to on cancel (the product page). */
  cancelPath?: string;
}

export type MerchCheckoutError =
  | "checkout-unavailable"
  | "product-unavailable"
  | "variant-not-available"
  | "creator-not-payable"
  | "currency-mismatch"
  | "fulfilment-unavailable"
  | "shipping-unavailable"
  | "pricing-invalid"
  | "unavailable";

export type MerchCheckoutResult =
  | {
      ok: true;
      orderId: string;
      publicReference: string;
      checkoutUrl: string;
      breakdown: MerchPricingBreakdown;
    }
  | { ok: false; error: MerchCheckoutError };

function publicOrderReference(): string {
  const raw = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `BMT-MERCH-${raw.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

async function loadPublishedProduct(
  productId: string,
  creatorId: string,
): Promise<MerchProductRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data: product } = await supabase
    .from("merch_products")
    .select("*")
    .eq("id", productId)
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .maybeSingle();
  return (product as MerchProductRow | null) ?? null;
}

export async function createMerchCheckout(
  input: MerchCheckoutInput,
): Promise<MerchCheckoutResult> {
  try {
    if (!isMerchCheckoutLive()) {
      return { ok: false, error: "checkout-unavailable" };
    }
    if (!isSupportedCurrency(input.currency)) {
      return { ok: false, error: "currency-mismatch" };
    }

    const product = await loadPublishedProduct(input.productId, input.creatorId);
    if (!product) {
      return { ok: false, error: "product-unavailable" };
    }
    // The customer's colour/size must be offered by this product.
    if (
      !(product.selected_colours ?? []).includes(input.colour) ||
      !(product.selected_sizes ?? []).includes(input.size)
    ) {
      return { ok: false, error: "variant-not-available" };
    }
    const curated = await getCuratedProductByIdInternal(product.curated_product_id);
    if (!curated) {
      return { ok: false, error: "product-unavailable" };
    }

    // The creator must be able to receive the eventual transfer, and settle in
    // the checkout currency (the profit is transferred in it).
    const account = await getConnectedAccountForUser(input.creatorId);
    if (!account || !canReceiveGifts(account)) {
      return { ok: false, error: "creator-not-payable" };
    }
    if (account.default_currency && account.default_currency !== input.currency) {
      return { ok: false, error: "currency-mismatch" };
    }

    const printful = getPrintfulClientOrNull();
    if (!printful) {
      return { ok: false, error: "fulfilment-unavailable" };
    }

    // Resolve the Printful variant from the chosen colour+size (restricted to
    // this product's curated variant set), and read its wholesale cost.
    const detail = await getCatalogProduct(printful, curated.printfulCatalogProductId);
    const allowed = new Set(product.selected_variant_ids ?? []);
    const variant = detail.variants.find(
      (v) => allowed.has(v.id) && v.color === input.colour && v.size === input.size,
    );
    if (!variant) {
      return { ok: false, error: "variant-not-available" };
    }
    // Printful bills the platform in its catalogue currency. If that doesn't
    // match the creator's sell currency, the margin would mix currencies — so
    // refuse rather than compute a wrong split. The beta runs where the two
    // match (the Printful store currency, e.g. EUR).
    if (variant.currency.toLowerCase() !== input.currency) {
      return { ok: false, error: "currency-mismatch" };
    }
    const printfulUnitCostMinor = variant.priceMinor;

    // Live shipping quote (cheapest option). Pass-through to the customer.
    const rates = await calculateShippingRates(printful, {
      recipient: {
        countryCode: input.recipient.countryCode,
        stateCode: input.recipient.stateCode,
        zip: input.recipient.zip,
        city: input.recipient.city,
        address1: input.recipient.address1,
      },
      items: [{ variantId: variant.id, quantity: input.quantity }],
      currency: input.currency,
    });
    const cheapest = rates
      .slice()
      .sort((a, b) => a.rateMinor - b.rateMinor)[0];
    if (!cheapest) {
      return { ok: false, error: "shipping-unavailable" };
    }
    const shippingMinor = cheapest.rateMinor;

    const pricing = calculateMerchPricing(
      {
        currency: input.currency,
        retailUnitPriceMinor: product.retail_price_minor,
        quantity: input.quantity,
        printfulUnitCostMinor,
        shippingChargedMinor: shippingMinor,
        printfulShippingCostMinor: shippingMinor,
        taxChargedMinor: 0,
        printfulTaxCostMinor: 0,
      },
      getMerchPricingConfig(),
    );
    if (!pricing.ok) {
      return { ok: false, error: "pricing-invalid" };
    }
    const b = pricing.breakdown;

    const supabase = getSupabaseAdminClient();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    // 1. Immutable quote.
    const { data: quote } = await supabase
      .from("merch_checkout_quotes")
      .insert({
        creator_id: input.creatorId,
        product_configuration_checksum: `${product.id}:${product.version}:${variant.id}:${input.quantity}`,
        destination_country: input.recipient.countryCode,
        destination_postcode: input.recipient.zip,
        currency: input.currency,
        merchandise_subtotal_minor: b.merchandiseSubtotalMinor,
        shipping_minor: b.shippingChargedMinor,
        tax_minor: b.taxChargedMinor,
        customer_total_minor: b.customerTotalMinor,
        printful_cost_snapshot: {
          unit_cost_minor: printfulUnitCostMinor,
          shipping_minor: shippingMinor,
          shipping_method: cheapest.id,
        },
        pricing_snapshot: b,
        printful_shipping_method: cheapest.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    const publicReference = publicOrderReference();

    // 2. Pending order (never 'paid' here).
    const { data: order, error: orderError } = await supabase
      .from("merch_orders")
      .insert({
        public_reference: publicReference,
        creator_id: input.creatorId,
        buyer_user_id: input.buyerUserId ?? null,
        buyer_email: input.buyerEmail ?? null,
        currency: input.currency,
        status: "awaiting_payment",
        payment_status: "pending",
        merchandise_subtotal_minor: b.merchandiseSubtotalMinor,
        shipping_charged_minor: b.shippingChargedMinor,
        tax_charged_minor: b.taxChargedMinor,
        customer_total_minor: b.customerTotalMinor,
        printful_product_cost_minor: b.printfulProductCostMinor,
        printful_shipping_cost_minor: b.printfulShippingCostMinor,
        printful_tax_cost_minor: b.printfulTaxCostMinor,
        printful_total_cost_minor: b.printfulTotalCostMinor,
        platform_fee_minor: b.platformFeeMinor,
        creator_profit_minor: b.creatorProfitMinor,
        pricing_version: b.pricingVersion,
        quote_id: (quote as { id: string } | null)?.id ?? null,
        quote_snapshot: b,
        shipping_address_snapshot: input.recipient,
        livemode: isLivemode(),
        placed_at: now.toISOString(),
      })
      .select("id")
      .single();
    if (orderError || !order) {
      return { ok: false, error: "unavailable" };
    }
    const orderId = (order as { id: string }).id;

    // 2b. Immutable line-item snapshot.
    await supabase.from("merch_order_items").insert({
      order_id: orderId,
      creator_product_id: product.id,
      creator_product_version: product.version,
      title: product.title,
      description: product.description,
      quantity: input.quantity,
      unit_price_minor: product.retail_price_minor,
      variant_id: variant.id,
      variant_name: variant.name,
      size: variant.size,
      colour: variant.color,
      printful_catalog_product_id: curated.printfulCatalogProductId,
      printful_catalog_variant_id: variant.id,
    });

    // 3. Stripe-hosted Checkout Session on the PLATFORM account (separate
    //    charges + transfers: NO transfer_data, so the platform collects the
    //    full total; the creator's profit is a separate transfer later). The
    //    order is only ever marked paid by the verified webhook.
    const stripe = getStripeClient();
    const origin = siteConfig.url.replace(/\/$/, "");
    const locale = isAppLocale(input.locale) ? input.locale : "en";
    const cancelUrl =
      input.cancelPath && input.cancelPath.startsWith("/")
        ? `${origin}${input.cancelPath}`
        : `${origin}/${locale}`;

    const lineItems: Array<{
      quantity: number;
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string };
      };
    }> = [
      {
        quantity: input.quantity,
        price_data: {
          currency: input.currency,
          unit_amount: product.retail_price_minor,
          product_data: { name: product.title },
        },
      },
    ];
    if (b.shippingChargedMinor > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: b.shippingChargedMinor,
          product_data: { name: "Shipping" },
        },
      });
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: publicReference,
        payment_method_types: ["card"],
        line_items: lineItems,
        payment_intent_data: {
          // NO transfer_data / application_fee — platform keeps the funds.
          description: `BuyMeATee merch order ${publicReference}`,
          metadata: {
            order_type: "merch",
            order_id: orderId,
            public_order_reference: publicReference,
            creator_id: input.creatorId,
            environment: isLivemode() ? "live" : "test",
          },
        },
        metadata: {
          order_type: "merch",
          order_id: orderId,
          public_order_reference: publicReference,
        },
        customer_email: input.buyerEmail ?? undefined,
        success_url: `${origin}/${locale}/merch/orders/${publicReference}/thanks`,
        cancel_url: cancelUrl,
      },
      { idempotencyKey: `bmat-merch-checkout-${orderId}` },
    );

    // The webhook matches the paid session to this order via metadata.order_id,
    // so there's no session id to persist here.
    if (!session.url) {
      return { ok: false, error: "unavailable" };
    }
    return {
      ok: true,
      orderId,
      publicReference,
      checkoutUrl: session.url,
      breakdown: b,
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}
