import { describe, expect, it } from "vitest";

import type { MerchFlags } from "@/lib/merch/config";
import {
  canManageMerch,
  evaluatePublishEligibility,
  type PublishEligibilityInput,
} from "@/lib/merch/permissions";

const onFlags: MerchFlags = {
  merchEnabled: true,
  creatorBetaEnabled: true,
  checkoutEnabled: false,
  printfulOrderSubmissionEnabled: false,
  automaticCreatorTransfersEnabled: false,
  complianceApproved: false,
};

const eligibleInput: PublishEligibilityInput = {
  flags: onFlags,
  shop: { betaAccess: true, termsAcceptedAt: "2026-07-25T00:00:00Z" },
  creatorDeactivated: false,
  connectedAccountReady: true,
  moderationStatus: "approved",
  mockupStatus: "ready",
  pricingValid: true,
};

describe("evaluatePublishEligibility", () => {
  it("permits publishing when every condition is met", () => {
    expect(evaluatePublishEligibility(eligibleInput)).toEqual({
      canPublish: true,
      blockers: [],
    });
  });

  it("lists every failing condition", () => {
    const result = evaluatePublishEligibility({
      ...eligibleInput,
      flags: { ...onFlags, merchEnabled: false },
      shop: { betaAccess: false, termsAcceptedAt: null },
      creatorDeactivated: true,
      connectedAccountReady: false,
      moderationStatus: "pending",
      mockupStatus: "processing",
      pricingValid: false,
    });
    expect(result.canPublish).toBe(false);
    expect(result.blockers).toEqual([
      "merch-disabled",
      "no-beta-access",
      "account-deactivated",
      "stripe-not-ready",
      "terms-not-accepted",
      "not-approved",
      "mockups-not-ready",
      "pricing-invalid",
    ]);
  });

  it("blocks when Stripe Connect is not ready", () => {
    const result = evaluatePublishEligibility({
      ...eligibleInput,
      connectedAccountReady: false,
    });
    expect(result.canPublish).toBe(false);
    expect(result.blockers).toEqual(["stripe-not-ready"]);
  });

  it("blocks an unapproved product even when everything else is ready", () => {
    const result = evaluatePublishEligibility({
      ...eligibleInput,
      moderationStatus: "changes_requested",
    });
    expect(result.blockers).toEqual(["not-approved"]);
  });
});

describe("canManageMerch", () => {
  it("requires the feature, beta access and an active account", () => {
    expect(canManageMerch(onFlags, { betaAccess: true }, false)).toBe(true);
    expect(canManageMerch(onFlags, { betaAccess: false }, false)).toBe(false);
    expect(canManageMerch(onFlags, { betaAccess: true }, true)).toBe(false);
    expect(
      canManageMerch({ ...onFlags, merchEnabled: false }, { betaAccess: true }, false),
    ).toBe(false);
  });
});
