import "server-only";

import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import {
  MERCH_PRICING_VERSION,
  type MerchPricingConfig,
} from "@/lib/merch/pricing";

/**
 * Server-side merchandise configuration and feature flags (Printful merch MVP).
 *
 * One module owns every merch tunable, read from the environment with
 * documented defaults, so pricing and rollout changes never touch UI. This
 * mirrors lib/payments/config.ts. Every live-money and live-fulfilment path is
 * OFF by default: merchandise is a staged rollout and must fail safe until an
 * operator explicitly enables each stage (see .env.example, §4 of the spec).
 *
 * Merchandise is deliberately kept separate from contributions/gifts: it has
 * its own fee model, its own charge/transfer flow (separate charges and
 * transfers, not the gift destination-charge model) and its own tables.
 */

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") {
    return fallback;
  }
  if (raw === "true" || raw === "1" || raw === "yes" || raw === "on") {
    return true;
  }
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off") {
    return false;
  }
  throw new Error(
    `Invalid ${name}: expected a boolean like "true"/"false", got "${raw}".`,
  );
}

function readIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 0 ||
    String(parsed) !== raw.trim()
  ) {
    throw new Error(
      `Invalid ${name}: expected a non-negative integer, got "${raw}".`,
    );
  }
  return parsed;
}

/**
 * Build a per-currency amount record, reading MERCH_<name>_<CUR> for each
 * currency and falling back to the documented default.
 */
function readCurrencyAmounts(
  envPrefix: string,
  defaults: Record<SupportedCurrency, number>,
): Record<SupportedCurrency, number> {
  return Object.fromEntries(
    SUPPORTED_CURRENCIES.map((currency) => [
      currency,
      readIntegerEnv(`${envPrefix}_${currency.toUpperCase()}`, defaults[currency]),
    ]),
  ) as Record<SupportedCurrency, number>;
}

/**
 * Merchandise feature flags. The gates compose so a rollout can advance one
 * stage at a time: build products without live checkout, take checkout without
 * auto-submitting to Printful, submit to Printful without auto-transferring
 * creator profit. Live money movement requires a compliance sign-off (§23).
 */
export interface MerchFlags {
  /** Global merchandise kill switch. When false, nothing merch is available. */
  merchEnabled: boolean;
  /** Gate creator product creation to invited beta creators. */
  creatorBetaEnabled: boolean;
  /** Allow supporters to actually pay for merchandise. Off by default. */
  checkoutEnabled: boolean;
  /** Allow automatic Printful order submission after payment. Off by default. */
  printfulOrderSubmissionEnabled: boolean;
  /** Allow automatic creator-profit transfers. Off by default (manual first). */
  automaticCreatorTransfersEnabled: boolean;
  /**
   * Records that the seller-of-record / VAT / sales-tax / OSS decision (§23)
   * has been made. A technical guardrail, NOT legal advice. Live checkout is
   * refused until this is true.
   */
  complianceApproved: boolean;
}

export function getMerchFlags(): MerchFlags {
  return {
    merchEnabled: readBooleanEnv("MERCH_ENABLED", false),
    creatorBetaEnabled: readBooleanEnv("MERCH_CREATOR_BETA_ENABLED", false),
    checkoutEnabled: readBooleanEnv("MERCH_CHECKOUT_ENABLED", false),
    printfulOrderSubmissionEnabled: readBooleanEnv(
      "PRINTFUL_ORDER_SUBMISSION_ENABLED",
      false,
    ),
    automaticCreatorTransfersEnabled: readBooleanEnv(
      "MERCH_AUTOMATIC_CREATOR_TRANSFERS_ENABLED",
      false,
    ),
    complianceApproved: readBooleanEnv("MERCH_COMPLIANCE_APPROVED", false),
  };
}

/**
 * Whether supporters may complete a live merchandise purchase right now. This
 * is the single authoritative gate the checkout path must consult: it requires
 * the feature on, checkout explicitly enabled AND the compliance sign-off.
 */
export function isMerchCheckoutLive(flags: MerchFlags = getMerchFlags()): boolean {
  return flags.merchEnabled && flags.checkoutEnabled && flags.complianceApproved;
}

/** Whether a creator may build/manage merch products (independent of checkout). */
export function isMerchCreatorStudioOpen(
  flags: MerchFlags = getMerchFlags(),
): boolean {
  return flags.merchEnabled && flags.creatorBetaEnabled;
}

/**
 * Per-currency minimum merchandise platform fee (minor units). A floor so tiny
 * margins still cover the platform's overhead. Defaults to 0 (no floor) — the
 * percentage fee applies unmodified until an operator sets a floor.
 */
const MINIMUM_PLATFORM_FEE_DEFAULTS: Record<SupportedCurrency, number> = {
  gbp: 0,
  eur: 0,
  usd: 0,
  cad: 0,
  aud: 0,
  nzd: 0,
  chf: 0,
  sek: 0,
  nok: 0,
  dkk: 0,
};

/**
 * Per-currency minimum creator profit (minor units). A product priced below
 * the point where the creator clears this after Printful cost and platform fee
 * cannot be published. Defaults to 1 major unit (100 minor; krona ~10:1).
 */
const MINIMUM_CREATOR_PROFIT_DEFAULTS: Record<SupportedCurrency, number> = {
  gbp: 100,
  eur: 100,
  usd: 100,
  cad: 100,
  aud: 100,
  nzd: 100,
  chf: 100,
  sek: 1000,
  nok: 1000,
  dkk: 1000,
};

/**
 * Authoritative merchandise pricing configuration. Injected into the pure
 * calculateMerchPricing() so the same maths backs server validation and any
 * client-side estimate (mirrors the gift fee model).
 */
export function getMerchPricingConfig(): MerchPricingConfig {
  const platformFeeBps = readIntegerEnv("MERCH_PLATFORM_FEE_BASIS_POINTS", 1000);
  if (platformFeeBps >= 10_000) {
    throw new Error("MERCH_PLATFORM_FEE_BASIS_POINTS must be below 100%.");
  }
  return {
    pricingVersion: MERCH_PRICING_VERSION,
    platformFeeBps,
    minimumPlatformFee: readCurrencyAmounts(
      "MERCH_MINIMUM_PLATFORM_FEE",
      MINIMUM_PLATFORM_FEE_DEFAULTS,
    ),
    minimumCreatorProfit: readCurrencyAmounts(
      "MERCH_MINIMUM_CREATOR_PROFIT",
      MINIMUM_CREATOR_PROFIT_DEFAULTS,
    ),
  };
}

/**
 * Creator-profit release policy: when the transfer of creator profit is made.
 * Defaults to on_first_shipment (§17). Configurable so operations can hold
 * transfers (manual) during the early beta.
 */
export type CreatorTransferReleasePolicy =
  | "manual"
  | "on_printful_confirmation"
  | "on_fulfilment_started"
  | "on_first_shipment";

const RELEASE_POLICIES: readonly CreatorTransferReleasePolicy[] = [
  "manual",
  "on_printful_confirmation",
  "on_fulfilment_started",
  "on_first_shipment",
];

export function getCreatorTransferReleasePolicy(): CreatorTransferReleasePolicy {
  const raw = process.env.MERCH_CREATOR_TRANSFER_RELEASE_POLICY?.trim();
  if (!raw) {
    return "on_first_shipment";
  }
  if (!(RELEASE_POLICIES as readonly string[]).includes(raw)) {
    throw new Error(
      `Invalid MERCH_CREATOR_TRANSFER_RELEASE_POLICY: got "${raw}".`,
    );
  }
  return raw as CreatorTransferReleasePolicy;
}
