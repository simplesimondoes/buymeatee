import {
  isSupportedCurrency,
  isValidMinorAmount,
  type SupportedCurrency,
} from "@/lib/payments/currency";

/**
 * The single authoritative merchandise pricing calculation (Printful merch MVP).
 *
 * Pure module: configuration is injected so the same function backs the server
 * (authoritative, from lib/merch/config.ts) and any browser estimate. All
 * amounts are integer minor units; all arithmetic is integer arithmetic — no
 * floating-point money maths, ever.
 *
 * Merchandise is NOT a contribution. The creator does not receive the retail
 * price. The platform collects the customer payment, retains the Printful
 * production cost, the Printful shipping cost and any Printful tax, plus a
 * merchandise platform fee, and only the remaining CREATOR PROFIT is ever
 * transferred to the creator's connected account.
 *
 * Model — the fee is charged on the creator's PRE-FEE MARGIN only. Shipping
 * and tax are pass-through: the customer pays them, the platform pays Printful
 * for them, and they never count as creator earnings.
 *
 *   preFeeCreatorMargin = merchandiseSubtotal - printfulProductCost
 *   platformFee         = round_half_up(preFeeCreatorMargin * feeBps / 10000)
 *                         (floored at the per-currency minimum, capped so
 *                          creator profit can never go negative)
 *   creatorProfit       = preFeeCreatorMargin - platformFee
 *
 * Worked example (feeBps = 1000 = 10%):
 *   retail price      £30.00  -> merchandiseSubtotal = 3000
 *   Printful cost     £18.00  -> printfulProductCost = 1800
 *   pre-fee margin    £12.00  -> 1200
 *   platform fee (10%) £1.20  -> 120
 *   creator profit    £10.80  -> 1080
 */

/** Bump whenever the merch pricing assumptions change; stored on every order. */
export const MERCH_PRICING_VERSION = "2026-07-merch-v1";

export interface MerchPricingConfig {
  /** Identifies the pricing assumptions; stored on every merch order. */
  pricingVersion: string;
  /** Merch platform fee in basis points of the pre-fee margin (1000 = 10%). */
  platformFeeBps: number;
  /** Per-currency minimum platform fee, minor units (a floor; may be 0). */
  minimumPlatformFee: Record<SupportedCurrency, number>;
  /** Per-currency minimum creator profit required to publish/sell, minor units. */
  minimumCreatorProfit: Record<SupportedCurrency, number>;
}

/**
 * Inputs to a single-creator, single-line pricing calculation. Quantity scales
 * the merchandise subtotal and the Printful product cost. Shipping and tax
 * (both what the customer is charged and what Printful charges the platform)
 * are optional and default to 0 — a product-margin preview passes none, a full
 * order quote passes live Printful values.
 */
export interface MerchPricingInput {
  currency: SupportedCurrency;
  /** Retail price of one unit, minor units. */
  retailUnitPriceMinor: number;
  /** Number of units. */
  quantity: number;
  /** Printful production cost for one unit, minor units. */
  printfulUnitCostMinor: number;
  /** Shipping charged to the customer, minor units (whole order). */
  shippingChargedMinor?: number;
  /** Tax charged to the customer, minor units (whole order). */
  taxChargedMinor?: number;
  /** Printful shipping cost billed to the platform, minor units (whole order). */
  printfulShippingCostMinor?: number;
  /** Printful tax billed to the platform, minor units (whole order). */
  printfulTaxCostMinor?: number;
}

export interface MerchPricingBreakdown {
  currency: SupportedCurrency;

  // What the customer sees / pays.
  merchandiseSubtotalMinor: number;
  shippingChargedMinor: number;
  taxChargedMinor: number;
  customerTotalMinor: number;

  // What the platform owes Printful (never shown to the customer).
  printfulProductCostMinor: number;
  printfulShippingCostMinor: number;
  printfulTaxCostMinor: number;
  printfulTotalCostMinor: number;

  // The split of the merchandise margin.
  preFeeCreatorMarginMinor: number;
  platformFeeMinor: number;
  creatorProfitMinor: number;

  pricingVersion: string;
}

export type MerchPricingError =
  | "unsupported-currency"
  | "invalid-amount"
  | "invalid-quantity"
  | "non-positive-margin"
  | "below-minimum-creator-profit";

export type MerchPricingResult =
  | { ok: true; breakdown: MerchPricingBreakdown }
  | { ok: false; error: MerchPricingError };

/** Integer division rounding half up (inputs are non-negative). */
function divideRoundHalfUp(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator / 2) / denominator);
}

function isNonNegativeMinor(value: unknown): value is number {
  return isValidMinorAmount(value) && (value as number) >= 0;
}

/**
 * Compute the authoritative merchandise pricing breakdown, or a typed error if
 * the configuration would leave the creator with a non-positive or too-small
 * profit (which must block publication and sale).
 */
export function calculateMerchPricing(
  input: MerchPricingInput,
  config: MerchPricingConfig,
): MerchPricingResult {
  if (!isSupportedCurrency(input.currency)) {
    return { ok: false, error: "unsupported-currency" };
  }
  if (
    !isValidMinorAmount(input.quantity) ||
    input.quantity <= 0 ||
    input.quantity > 1000
  ) {
    return { ok: false, error: "invalid-quantity" };
  }

  const shippingCharged = input.shippingChargedMinor ?? 0;
  const taxCharged = input.taxChargedMinor ?? 0;
  const printfulShipping = input.printfulShippingCostMinor ?? 0;
  const printfulTax = input.printfulTaxCostMinor ?? 0;

  if (
    !isNonNegativeMinor(input.retailUnitPriceMinor) ||
    input.retailUnitPriceMinor <= 0 ||
    !isNonNegativeMinor(input.printfulUnitCostMinor) ||
    !isNonNegativeMinor(shippingCharged) ||
    !isNonNegativeMinor(taxCharged) ||
    !isNonNegativeMinor(printfulShipping) ||
    !isNonNegativeMinor(printfulTax)
  ) {
    return { ok: false, error: "invalid-amount" };
  }

  const merchandiseSubtotal = input.retailUnitPriceMinor * input.quantity;
  const printfulProductCost = input.printfulUnitCostMinor * input.quantity;

  const preFeeCreatorMargin = merchandiseSubtotal - printfulProductCost;
  if (preFeeCreatorMargin <= 0) {
    return { ok: false, error: "non-positive-margin" };
  }

  const percentageFee = divideRoundHalfUp(
    preFeeCreatorMargin * config.platformFeeBps,
    10_000,
  );
  const flooredFee = Math.max(
    percentageFee,
    config.minimumPlatformFee[input.currency],
  );
  // Never let the platform fee exceed the margin — creator profit stays >= 0.
  const platformFee = Math.min(flooredFee, preFeeCreatorMargin);
  const creatorProfit = preFeeCreatorMargin - platformFee;

  if (creatorProfit < config.minimumCreatorProfit[input.currency]) {
    return { ok: false, error: "below-minimum-creator-profit" };
  }

  const customerTotal = merchandiseSubtotal + shippingCharged + taxCharged;
  const printfulTotalCost = printfulProductCost + printfulShipping + printfulTax;

  return {
    ok: true,
    breakdown: {
      currency: input.currency,
      merchandiseSubtotalMinor: merchandiseSubtotal,
      shippingChargedMinor: shippingCharged,
      taxChargedMinor: taxCharged,
      customerTotalMinor: customerTotal,
      printfulProductCostMinor: printfulProductCost,
      printfulShippingCostMinor: printfulShipping,
      printfulTaxCostMinor: printfulTax,
      printfulTotalCostMinor: printfulTotalCost,
      preFeeCreatorMarginMinor: preFeeCreatorMargin,
      platformFeeMinor: platformFee,
      creatorProfitMinor: creatorProfit,
      pricingVersion: config.pricingVersion,
    },
  };
}

/**
 * The lowest retail unit price at which a product with the given Printful unit
 * cost clears the minimum creator profit, for a single unit. Useful for the
 * product wizard's "minimum price" guidance. Returns minor units.
 *
 * Solves for the smallest retail R such that, with margin M = R - cost and
 * fee = max(round(M*bps/10000), floor) capped at M, profit = M - fee >=
 * minProfit. Computed by a bounded search rather than inverting the rounding.
 */
export function minimumRetailUnitPriceMinor(
  currency: SupportedCurrency,
  printfulUnitCostMinor: number,
  config: MerchPricingConfig,
): number {
  const minProfit = config.minimumCreatorProfit[currency];
  // Lower bound: cost + minProfit (fee would be 0). Walk up until profit clears.
  let retail = printfulUnitCostMinor + minProfit;
  // Cap the search generously; margins this large are never blocked in practice.
  const ceiling = printfulUnitCostMinor + minProfit * 3 + 10_000;
  while (retail <= ceiling) {
    const result = calculateMerchPricing(
      {
        currency,
        retailUnitPriceMinor: retail,
        quantity: 1,
        printfulUnitCostMinor,
      },
      config,
    );
    if (result.ok && result.breakdown.creatorProfitMinor >= minProfit) {
      return retail;
    }
    retail += 1;
  }
  return retail;
}
