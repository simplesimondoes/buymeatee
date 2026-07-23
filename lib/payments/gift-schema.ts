import {
  isSupportedCurrency,
  isValidMinorAmount,
  type SupportedCurrency,
} from "@/lib/payments/currency";

/**
 * Gift composer input validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — the API revalidates everything and
 * recalculates all amounts; client totals are never trusted).
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
}

export type GiftFieldName =
  | "recipientUsername"
  | "giftAmount"
  | "currency"
  | "senderName"
  | "senderEmail"
  | "message"
  | "isAnonymous"
  | "goalId";

export type GiftValidationResult =
  | { ok: true; data: GiftInput }
  | { ok: false; errors: Partial<Record<GiftFieldName, string>> };

const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateGiftInput(payload: unknown): GiftValidationResult {
  const errors: Partial<Record<GiftFieldName, string>> = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const recipientUsername =
    typeof input.recipientUsername === "string"
      ? input.recipientUsername.trim().toLowerCase()
      : "";
  if (!USERNAME_PATTERN.test(recipientUsername)) {
    errors.recipientUsername = "We couldn't tell who this Tee is for.";
  }

  const giftAmount = input.giftAmount;
  if (!isValidMinorAmount(giftAmount) || giftAmount <= 0) {
    errors.giftAmount = "Enter a valid amount.";
  }

  if (!isSupportedCurrency(input.currency)) {
    errors.currency = "That currency isn't supported.";
  }

  const senderName =
    typeof input.senderName === "string" ? input.senderName.trim() : "";
  if (senderName.length < 1 || senderName.length > SENDER_NAME_MAX_LENGTH) {
    errors.senderName = `Add your name (up to ${SENDER_NAME_MAX_LENGTH} characters).`;
  }

  let senderEmail: string | undefined;
  if (typeof input.senderEmail === "string" && input.senderEmail.trim() !== "") {
    senderEmail = input.senderEmail.trim();
    if (senderEmail.length > 200 || !EMAIL_PATTERN.test(senderEmail)) {
      errors.senderEmail = "That email address doesn't look right.";
    }
  }

  let message: string | undefined;
  if (typeof input.message === "string" && input.message.trim() !== "") {
    message = input.message.trim();
    if (message.length > GIFT_MESSAGE_MAX_LENGTH) {
      errors.message = `Keep the message under ${GIFT_MESSAGE_MAX_LENGTH} characters.`;
    }
  }

  let goalId: string | undefined;
  if (typeof input.goalId === "string" && input.goalId.trim() !== "") {
    goalId = input.goalId.trim();
    if (!UUID_PATTERN.test(goalId)) {
      errors.goalId = "That goal reference doesn't look right.";
    }
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
