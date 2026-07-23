import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Payment domain types mirroring supabase/migrations/*_stripe_connect_payments.sql.
 * Amounts are integer minor units throughout.
 */

export const GIFT_STATUSES = [
  "draft",
  "checkout_created",
  "processing",
  "paid",
  "payment_failed",
  "expired",
  "partially_refunded",
  "refunded",
  "disputed",
  "dispute_won",
  "dispute_lost",
  "cancelled",
] as const;

export type GiftStatus = (typeof GIFT_STATUSES)[number];

/** Statuses in which money has reached (or passed through) the recipient. */
export const PAID_FAMILY_STATUSES: readonly GiftStatus[] = [
  "paid",
  "partially_refunded",
  "refunded",
  "disputed",
  "dispute_won",
  "dispute_lost",
];

export interface ConnectedAccountRow {
  id: string;
  user_id: string;
  stripe_account_id: string;
  country: string;
  default_currency: SupportedCurrency | null;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_complete: boolean;
  currently_due: string[];
  eventually_due: string[];
  disabled_reason: string | null;
  livemode: boolean;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface GiftRow {
  id: string;
  public_id: string;
  sender_user_id: string | null;
  recipient_user_id: string;
  recipient_connected_account_id: string;
  /** Optional goal this gift supports (ADR-011). */
  goal_id: string | null;
  sender_name: string;
  sender_email: string | null;
  message: string | null;
  currency: SupportedCurrency;
  gift_amount: number;
  platform_fee_amount: number;
  payment_handling_amount: number;
  application_fee_amount: number;
  total_amount: number;
  amount_refunded: number;
  status: GiftStatus;
  is_anonymous: boolean;
  fee_model_version: string;
  livemode: boolean;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_application_fee_id: string | null;
  stripe_transfer_id: string | null;
  stripe_refund_id: string | null;
  failure_code: string | null;
  failure_message: string | null;
  reconciliation_error: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

/**
 * A recipient's payment-setup state as shown in Settings → Payments.
 * Derived server-side from the synced connected-account row.
 */
export type PaymentSetupState =
  | "not_started"
  | "onboarding_not_started"
  | "onboarding_incomplete"
  | "information_required"
  | "verification_pending"
  | "ready"
  | "payments_restricted"
  | "payouts_disabled";

export function derivePaymentSetupState(
  account: Pick<
    ConnectedAccountRow,
    | "details_submitted"
    | "charges_enabled"
    | "payouts_enabled"
    | "onboarding_complete"
    | "currently_due"
    | "disabled_reason"
  > | null,
): PaymentSetupState {
  if (!account) {
    return "not_started";
  }
  if (!account.details_submitted) {
    return account.onboarding_complete || account.currently_due.length > 0
      ? "onboarding_incomplete"
      : "onboarding_not_started";
  }
  if (account.charges_enabled && account.payouts_enabled) {
    return account.currently_due.length > 0 ? "information_required" : "ready";
  }
  if (!account.charges_enabled) {
    // Details submitted but charges not yet enabled: either Stripe is still
    // verifying, Stripe needs more information, or the account is restricted.
    if (account.currently_due.length > 0) {
      return "information_required";
    }
    return account.disabled_reason ? "payments_restricted" : "verification_pending";
  }
  return "payouts_disabled";
}

/** True when the account can receive a destination charge right now. */
export function canReceiveGifts(
  account: Pick<
    ConnectedAccountRow,
    | "details_submitted"
    | "charges_enabled"
    | "payouts_enabled"
    | "onboarding_complete"
    | "currently_due"
    | "disabled_reason"
  > | null,
): boolean {
  if (!account) {
    return false;
  }
  return (
    account.details_submitted &&
    account.charges_enabled &&
    account.payouts_enabled
  );
}
