import "server-only";

import type { CreatorGoalRow } from "@/lib/goals/types";
import { getOwnGoals } from "@/lib/goals/goals";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import {
  canReceiveGifts,
  derivePaymentSetupState,
  type ConnectedAccountRow,
  type PaymentSetupState,
} from "@/lib/payments/types";
import { getOwnProfile, type OwnProfile } from "@/lib/profile/profile";

/**
 * Everything the dashboard needs to describe a creator's setup, computed
 * from live data on every load — deliberately no stored "step completed"
 * booleans that could drift from reality (issue #26).
 */

export interface CreatorSetupState {
  profile: OwnProfile | null;
  goals: CreatorGoalRow[];
  account: ConnectedAccountRow | null;
  paymentState: PaymentSetupState;
  /** Any of the loads failed — cards must show honest unavailable states. */
  profileUnavailable: boolean;
  goalsUnavailable: boolean;
  paymentsUnavailable: boolean;
  steps: {
    claimedLink: boolean;
    profileComplete: boolean;
    hasActiveGoal: boolean;
    paymentsReady: boolean;
  };
}

export async function getCreatorSetupState(
  userId: string,
): Promise<CreatorSetupState> {
  const [profileResult, goalsResult, accountResult] = await Promise.allSettled([
    getOwnProfile(userId),
    getOwnGoals(userId),
    getConnectedAccountForUser(userId),
  ]);

  const profile =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const goals = goalsResult.status === "fulfilled" ? goalsResult.value : [];
  const account =
    accountResult.status === "fulfilled" ? accountResult.value : null;

  return {
    profile,
    goals,
    account,
    paymentState: derivePaymentSetupState(account),
    profileUnavailable: profileResult.status === "rejected",
    goalsUnavailable: goalsResult.status === "rejected",
    paymentsUnavailable: accountResult.status === "rejected",
    steps: {
      claimedLink: Boolean(profile?.username),
      profileComplete: Boolean(
        profile?.display_name && (profile.bio || profile.avatar_url),
      ),
      hasActiveGoal: goals.some((goal) => goal.status === "active"),
      paymentsReady: canReceiveGifts(account),
    },
  };
}
