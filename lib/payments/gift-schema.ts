import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import {
  isSupportedCurrency,
  isValidMinorAmount,
  type SupportedCurrency,
} from "@/lib/payments/currency";

/**
 * Gift composer input validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — the API revalidates everything and
 * recalculates all amounts; client totals are never trusted).
 *
 * Errors are stable codes into the `errors` message namespace (ADR-019) —
 * rendered into the visitor's language at the edge, never English here.
 */

export const GIFT_MESSAGE_MAX_LENGTH = 280;
export const SENDER_NAME_MAX_LENGTH = 100;

export interface GiftInput {
  recipientUsername: string;
  /** Integer minor units. Bounds are enforced server-side by the fee config. */
  giftAmount: number;
  currency: SupportedCurrency;
  senderName: string;
  senderEmail?: string;
  message?: string;
  isAnonymous: boolean;
  /**
   * Optional goal this Tee supports. Must be an ACTIVE goal of the recipient
   * in the same currency — verified server-side at checkout, never trusted.
   */
  goalId?: string;
  /**
   * Optional wish-list item this Tee funds outright (ADR-018). Must be an
   * ACTIVE item of the recipient, and the gift amount must equal its price —
   * verified server-side at checkout. Mutually exclusive with goalId.
   */
  wishlistItemId?: string;
}

export type GiftFieldName =
  | "recipientUsername"
  | "giftAmount"
  | "currency"
  | "senderName"
  | "senderEmail"
  | "message"
  | "isAnonymous"
  | "goalId"
  | "wishlistItemId";

export type GiftValidationResult =
  | { ok: true; data: GiftInput }
  | { ok: false; errors: Partial<Record<GiftFieldName, ErrorDetail>> };

const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateGiftInput(payload: unknown): GiftValidationResult {
  const errors: Partial<Record<GiftFieldName, ErrorDetail>> = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const recipientUsername =
    typeof input.recipientUsername === "string"
      ? input.recipientUsername.trim().toLowerCase()
      : "";
  if (!USERNAME_PATTERN.test(recipientUsername)) {
    errors.recipientUsername = errorDetail("validation.gift.recipient");
  }

  const giftAmount = input.giftAmount;
  if (!isValidMinorAmount(giftAmount) || giftAmount <= 0) {
    errors.giftAmount = errorDetail("validation.gift.amount");
  }

  if (!isSupportedCurrency(input.currency)) {
    errors.currency = errorDetail("validation.gift.currency");
  }

  const senderName =
    typeof input.senderName === "string" ? input.senderName.trim() : "";
  if (senderName.length < 1 || senderName.length > SENDER_NAME_MAX_LENGTH) {
    errors.senderName = errorDetail("validation.gift.senderName", {
      max: SENDER_NAME_MAX_LENGTH,
    });
  }

  let senderEmail: string | undefined;
  if (typeof input.senderEmail === "string" && input.senderEmail.trim() !== "") {
    senderEmail = input.senderEmail.trim();
    if (senderEmail.length > 200 || !EMAIL_PATTERN.test(senderEmail)) {
      errors.senderEmail = errorDetail("validation.gift.senderEmail");
    }
  }

  let message: string | undefined;
  if (typeof input.message === "string" && input.message.trim() !== "") {
    message = input.message.trim();
    if (message.length > GIFT_MESSAGE_MAX_LENGTH) {
      errors.message = errorDetail("validation.gift.message", {
        max: GIFT_MESSAGE_MAX_LENGTH,
      });
    }
  }

  let goalId: string | undefined;
  if (typeof input.goalId === "string" && input.goalId.trim() !== "") {
    goalId = input.goalId.trim();
    if (!UUID_PATTERN.test(goalId)) {
      errors.goalId = errorDetail("validation.gift.goalRef");
    }
  }

  let wishlistItemId: string | undefined;
  if (
    typeof input.wishlistItemId === "string" &&
    input.wishlistItemId.trim() !== ""
  ) {
    wishlistItemId = input.wishlistItemId.trim();
    if (!UUID_PATTERN.test(wishlistItemId)) {
      errors.wishlistItemId = errorDetail("validation.gift.itemRef");
    }
  }

  // A Tee funds at most one thing: a goal OR a wish-list item, never both.
  if (goalId && wishlistItemId) {
    errors.wishlistItemId = errorDetail("validation.gift.targetConflict");
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      recipientUsername,
      giftAmount: giftAmount as number,
      currency: input.currency as SupportedCurrency,
      senderName,
      senderEmail,
      message,
      isAnonymous: input.isAnonymous === true,
      goalId,
      wishlistItemId,
    },
  };
}

/**
 * Parse a donor-typed major amount ("5", "5.50") into integer minor units
 * using string arithmetic — no floats. Returns null when not parseable.
 */
export function parseMajorAmountToMinor(raw: string): number | null {
  const match = /^\s*(\d{1,7})(?:[.,](\d{1,2}))?\s*$/.exec(raw);
  if (!match) {
    return null;
  }
  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt((match[2] ?? "").padEnd(2, "0") || "0", 10);
  return major * 100 + minor;
}
