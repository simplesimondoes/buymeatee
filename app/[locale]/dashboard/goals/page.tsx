import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { GoalManager } from "@/components/goals/goal-manager";
import { getOwnGoals } from "@/lib/goals/goals";
import type { CreatorGoalRow } from "@/lib/goals/types";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getOwnProfile } from "@/lib/profile/profile";
import { siteConfig } from "@/lib/site";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "dashboard",
  });
  return {
    title: t("meta.goals.title"),
    description: t("meta.goals.description"),
    robots: { index: false, follow: false },
  };
}

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "dashboard",
  });

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/dashboard/goals`)}`,
      locale: locale as AppLocale,
    });
  }

  let goals: CreatorGoalRow[] = [];
  let unavailable = false;
  try {
    goals = await getOwnGoals(user.id);
  } catch {
    unavailable = true;
  }

  // Lock new goals to the creator's payout currency (if their account is set
  // up), so they can't create a goal supporters are unable to fund.
  let payoutCurrency: SupportedCurrency | undefined;
  try {
    const account = await getConnectedAccountForUser(user.id);
    payoutCurrency = account?.default_currency ?? undefined;
  } catch {
    payoutCurrency = undefined;
  }

  // Sharing links to the creator's public page — only once they've claimed a
  // username, so the share targets a real, reachable URL.
  let pageUrl: string | undefined;
  try {
    const profile = await getOwnProfile(user.id);
    pageUrl = profile?.username
      ? `${siteConfig.url.replace(/\/$/, "")}/t/${profile.username}`
      : undefined;
  } catch {
    pageUrl = undefined;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("goals.page.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {t("goals.page.intro")}
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            {t("goals.page.unavailable")}
          </div>
        ) : (
          <GoalManager
            initialGoals={goals}
            payoutCurrency={payoutCurrency}
            pageUrl={pageUrl}
          />
        )}
      </div>
    </main>
  );
}
