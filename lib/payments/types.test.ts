import { describe, expect, it } from "vitest";

import {
  canReceiveGifts,
  derivePaymentSetupState,
} from "@/lib/payments/types";

const base = {
  details_submitted: false,
  charges_enabled: false,
  payouts_enabled: false,
  onboarding_complete: false,
  currently_due: [] as string[],
  disabled_reason: null as string | null,
};

describe("derivePaymentSetupState", () => {
  it("maps every documented state", () => {
    expect(derivePaymentSetupState(null)).toBe("not_started");
    expect(derivePaymentSetupState(base)).toBe("onboarding_not_started");
    expect(
      derivePaymentSetupState({ ...base, currently_due: ["individual.dob"] }),
    ).toBe("onboarding_incomplete");
    expect(
      derivePaymentSetupState({
        ...base,
        details_submitted: true,
        onboarding_complete: true,
      }),
    ).toBe("verification_pending");
    expect(
      derivePaymentSetupState({
        ...base,
        details_submitted: true,
        currently_due: ["individual.verification.document"],
      }),
    ).toBe("information_required");
    expect(
      derivePaymentSetupState({
        ...base,
        details_submitted: true,
        disabled_reason: "requirements.past_due",
      }),
    ).toBe("payments_restricted");
    expect(
      derivePaymentSetupState({
        ...base,
        details_submitted: true,
        charges_enabled: true,
      }),
    ).toBe("payouts_disabled");
    expect(
      derivePaymentSetupState({
        ...base,
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
      }),
    ).toBe("ready");
    expect(
      derivePaymentSetupState({
        ...base,
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        currently_due: ["individual.verification.document"],
      }),
    ).toBe("information_required");
  });
});

describe("canReceiveGifts", () => {
  it("requires submitted details plus charges and payouts enabled", () => {
    expect(canReceiveGifts(null)).toBe(false);
    expect(canReceiveGifts(base)).toBe(false);
    expect(
      canReceiveGifts({ ...base, details_submitted: true, charges_enabled: true }),
    ).toBe(false);
    expect(
      canReceiveGifts({
        ...base,
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
      }),
    ).toBe(true);
  });
});
