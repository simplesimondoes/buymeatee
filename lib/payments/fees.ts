import {
  isSupportedCurrency,
  isValidMinorAmount,
  type SupportedCurrency,
} from "@/lib/payments/currency";

/**
 * The single authoritative fee calculation (ADR-009).
 *
 * Pure module: configuration is injected so the same function backs the
 * server (authoritative, from lib/payments/config.ts) and the browser
 * estimate (from a server-rendered snapshot). All amounts are integer minor
 * units; all arithmetic is integer arithmetic.
 *
 * Model — the platform fee and payment handling are added ON TOP of the
 * gift, so the recipient's destination transfer equals the gift exactly:
 *
 *   totalChargeAmount     = giftAmount + platformFeeAmount + paymentHandlingAmount
 *   applicationFeeAmount  = platformFeeAmount + paymentHandlingAmount
 *   recipientTargetAmount = totalChargeAmount - applicationFeeAmount = giftAmount
 *
 * paymentHandlingAmount covers Stripe's processing charge on the WHOLE total
 * (which includes the handling amount itself), so it is grossed up:
 *
 *   handling >= (total * feePercent + fixedFee)
 *   handling  = ceil(((gift + platformFee) * feeBps + fixed * 10000) / (10000 - feeBps))
 *
 * Stripe's real charge varies by card type and country; this is a documented
 * commercial assumption, not a claim of Stripe's exact fee (see
 * docs/stripe-connect-setup.md).
 */

export interface FeeConfig {
  /** Identifies the pricing assumptions; stored on every gift. */
  feeModelVersion: string;
  /** Platform fee in basis points of the gift amount (500 = 5%). */
  platformFeeBps: number;
  /** Assumed processing percentage in basis points of the total (150 = 1.5%). */
  paymentFeeBps: number;
  /** Assumed fixed processing fee per payment, minor units, per currency. */
  paymentFeeFixed: Record<SupportedCurrency, number>;
  /** Inclusive bounds for the gift amount, minor units, per currency. */
  minimumGift: Record<SupportedCurrency, number>;
  maximumGift: Record<SupportedCurrency, number>;
}

export interface FeeBreakdown {
  currency: SupportedCurrency;
  giftAmount: number;
  platformFeeAmount: number;
  paymentHandlingAmount: number;
  applicationFeeAmount: number;
  totalChargeAmount: number;
  /** What the connected account receives from the destination charge. */
  recipientTargetAmount: number;
  feeModelVersion: string;
}

export type FeeCalculationError =
  | "unsupported-currency"
  | "invalid-amount"
  | "below-minimum"
  | "above-maximum";

export type FeeCalculationResult =
  | { ok: true; breakdown: FeeBreakdown }
  | { ok: false; error: FeeCalculationError };

/** Integer division rounding half away from zero (inputs are non-negative). */
function divideRoundHalfUp(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator / 2) / denominator);
}

function divideRoundUp(numerator: number, denominator: number): number {
  return Math.ceil(numerator / denominator);
}

export function calculateFees(
  giftAmount: unknown,
  currency: unknown,
  config: FeeConfig,
): FeeCalculationResult {
  if (!isSupportedCurrency(currency)) {
    return { ok: false, error: "unsupported-currency" };
  }
  if (!isValidMinorAmount(giftAmount) || giftAmount <= 0) {
    return { ok: false, error: "invalid-amount" };
  }
  if (giftAmount < config.minimumGift[currency]) {
    return { ok: false, error: "below-minimum" };
  }
  if (giftAmount > config.maximumGift[currency]) {
    return { ok: false, error: "above-maximum" };
  }

  const platformFeeAmount = divideRoundHalfUp(
    giftAmount * config.platformFeeBps,
    10_000,
  );

  const fixed = config.paymentFeeFixed[currency];
  const paymentHandlingAmount =
    config.paymentFeeBps === 0 && fixed === 0
      ? 0
      : divideRoundUp(
          (giftAmount + platformFeeAmount) * config.paymentFeeBps +
            fixed * 10_000,
          10_000 - config.paymentFeeBps,
        );

  const totalChargeAmount =
    giftAmount + platformFeeAmount + paymentHandlingAmount;
  const applicationFeeAmount = platformFeeAmount + paymentHandlingAmount;

  return {
    ok: true,
    breakdown: {
      currency,
      giftAmount,
      platformFeeAmount,
      paymentHandlingAmount,
      applicationFeeAmount,
      totalChargeAmount,
      recipientTargetAmount: totalChargeAmount - applicationFeeAmount,
      feeModelVersion: config.feeModelVersion,
    },
  };
}
