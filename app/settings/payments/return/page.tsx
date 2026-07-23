import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getConnectedAccountForUser,
  syncConnectedAccount,
} from "@/lib/payments/connect";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Finishing payment setup",
  robots: { index: false, follow: false },
};

/**
 * Stripe sends users here after hosted onboarding. Returning does NOT mean
 * onboarding finished — sync the real account state from Stripe, then show
 * the settings page, which renders the verified status.
 */
export default async function ConnectReturnPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fsettings%2Fpayments");
  }

  const account = await getConnectedAccountForUser(user.id);
  if (account) {
    try {
      await syncConnectedAccount(account.stripe_account_id);
    } catch {
      // The settings page will retry the sync and show last known state.
    }
  }

  redirect("/settings/payments");
}
