import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import {
  getConnectedAccountForUser,
  syncConnectedAccount,
} from "@/lib/payments/connect";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "settings",
  });
  return {
    title: t("meta.paymentsReturn.title"),
    robots: { index: false, follow: false },
  };
}

/**
 * Stripe sends users here after hosted onboarding. Returning does NOT mean
 * onboarding finished — sync the real account state from Stripe, then show
 * the settings page, which renders the verified status.
 */
export default async function ConnectReturnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/settings/payments`)}`,
      locale: locale as AppLocale,
    });
  }

  const account = await getConnectedAccountForUser(user.id);
  if (account) {
    try {
      await syncConnectedAccount(account.stripe_account_id);
    } catch {
      // The settings page will retry the sync and show last known state.
    }
  }

  redirect({ href: "/settings/payments", locale: locale as AppLocale });
}
