import type { MerchFlags } from "@/lib/merch/config";
import type {
  MerchMockupStatus,
  MerchModerationStatus,
  MerchShopSettings,
} from "@/lib/merch/types";

/**
 * Merchandise eligibility rules (Printful merch MVP, ADR-024, spec §11).
 *
 * Pure module: every input is passed in so the rules are exhaustively
 * unit-tested without Supabase/Stripe. These are the SINGLE source of truth for
 * "may this creator run a shop / publish this product" — server actions call
 * them; RLS is the second line of defence.
 */

export type MerchPublishBlocker =
  | "merch-disabled"
  | "no-beta-access"
  | "account-deactivated"
  | "stripe-not-ready"
  | "terms-not-accepted"
  | "not-approved"
  | "mockups-not-ready"
  | "pricing-invalid";

export interface PublishEligibilityInput {
  flags: MerchFlags;
  shop: Pick<MerchShopSettings, "betaAccess" | "termsAcceptedAt">;
  /** True when profiles.deactivated_at is set. */
  creatorDeactivated: boolean;
  /** canReceiveGifts(account) from lib/payments — details+charges+payouts. */
  connectedAccountReady: boolean;
  moderationStatus: MerchModerationStatus;
  mockupStatus: MerchMockupStatus;
  /** calculateMerchPricing(...) succeeded and cleared the minimum profit. */
  pricingValid: boolean;
}

export interface PublishEligibility {
  canPublish: boolean;
  blockers: MerchPublishBlocker[];
}

/**
 * Evaluate whether a creator may PUBLISH a product. Returns every failing
 * condition so the UI can list precisely what is missing (not just a boolean).
 */
export function evaluatePublishEligibility(
  input: PublishEligibilityInput,
): PublishEligibility {
  const blockers: MerchPublishBlocker[] = [];

  if (!input.flags.merchEnabled) {
    blockers.push("merch-disabled");
  }
  if (!input.shop.betaAccess) {
    blockers.push("no-beta-access");
  }
  if (input.creatorDeactivated) {
    blockers.push("account-deactivated");
  }
  if (!input.connectedAccountReady) {
    blockers.push("stripe-not-ready");
  }
  if (!input.shop.termsAcceptedAt) {
    blockers.push("terms-not-accepted");
  }
  if (input.moderationStatus !== "approved") {
    blockers.push("not-approved");
  }
  if (input.mockupStatus !== "ready") {
    blockers.push("mockups-not-ready");
  }
  if (!input.pricingValid) {
    blockers.push("pricing-invalid");
  }

  return { canPublish: blockers.length === 0, blockers };
}

/**
 * Whether a creator may access the merch product studio at all (independent of
 * publishing a specific product). Requires the feature on, beta access, and an
 * active (non-deactivated) account.
 */
export function canManageMerch(
  flags: MerchFlags,
  shop: Pick<MerchShopSettings, "betaAccess">,
  creatorDeactivated: boolean,
): boolean {
  return flags.merchEnabled && shop.betaAccess && !creatorDeactivated;
}
