import {
  isSupportedCurrency,
  isValidMinorAmount,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TARGET_MAX_MINOR,
  GOAL_TITLE_MAX_LENGTH,
} from "@/lib/goals/types";

/**
 * Goal form input validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — mutations revalidate everything).
 * Status changes are validated separately via canTransitionGoal().
 */

export interface GoalInput {
  title: string;
  description?: string;
  currency: SupportedCurrency;
  /** Integer minor units. */
  targetAmount: number;
}

export type GoalFieldName = "title" | "description" | "currency" | "targetAmount";

export type GoalValidationResult =
  | { ok: true; data: GoalInput }
  | { ok: false; errors: Partial<Record<GoalFieldName, string>> };

export function validateGoalInput(payload: unknown): GoalValidationResult {
  const errors: Partial<Record<GoalFieldName, string>> = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length < 1 || title.length > GOAL_TITLE_MAX_LENGTH) {
    errors.title = `Give your goal a title (up to ${GOAL_TITLE_MAX_LENGTH} characters).`;
  }

  let description: string | undefined;
  if (
    typeof input.description === "string" &&
    input.description.trim() !== ""
  ) {
    description = input.description.trim();
    if (description.length > GOAL_DESCRIPTION_MAX_LENGTH) {
      errors.description = `Keep the description under ${GOAL_DESCRIPTION_MAX_LENGTH} characters.`;
    }
  }

  if (!isSupportedCurrency(input.currency)) {
    errors.currency = "That currency isn't supported.";
  }

  const targetAmount = input.targetAmount;
  if (
    !isValidMinorAmount(targetAmount) ||
    targetAmount <= 0 ||
    targetAmount > GOAL_TARGET_MAX_MINOR
  ) {
    errors.targetAmount = "Enter a valid target amount.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      currency: input.currency as SupportedCurrency,
      targetAmount: targetAmount as number,
    },
  };
}
