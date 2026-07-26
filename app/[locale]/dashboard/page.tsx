import type { AppLocale } from "@/i18n/locales";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";

import { Avatar } from "@/components/profile/avatar";
import { CopyLinkButton } from "@/components/profile/copy-link-button";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { OnboardingChecklist } from "@/components/profile/onboarding-checklist";
import { ShareControls } from "@/components/share-controls";
import { pageShareText } from "@/lib/goals/share";
import { siteConfig } from "@/lib/site";
import { formatMinorAmount } from "@/lib/i18n/format";
import { getOwnPosts } from "@/lib/journey/posts";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getCreatorSetupState } from "@/lib/profile/setup-state";
import { getCreatorSupport } from "@/lib/support/public";
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
    title: t("meta.overview.title"),
    description: t("meta.overview.description"),
    robots: { index: false, follow: false },
  };
}

function CardShell({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col rounded-3xl border border-stone bg-white p-6"
    >
      <h2 className="font-serif text-lg font-semibold text-forest">{title}</h2>
      <div className="mt-3 flex-1 text-sm leading-relaxed text-ink/75">
        {children}
      </div>
      <Link
        href={href}
        className="mt-4 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
      >
        {linkLabel}
        <span aria-hidden="true" className="ml-1">
          →
        </span>
      </Link>
    </section>
  );
}

export default async function DashboardPage({
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
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/dashboard`)}`,
      locale: locale as AppLocale,
    });
  }

  const state = await getCreatorSetupState(user.id);
  const { profile, goals } = state;

  // Verified stats for the at-a-glance row — never invented (CLAUDE.md).
  const supporters = await getCreatorSupport(user.id)
    .then((s) => s.totalCount)
    .catch(() => 0);
  const journeyPosts = await getOwnPosts(user.id)
    .then((posts) => posts.filter((p) => p.status === "published").length)
    .catch(() => 0);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const raisedByCurrency = new Map<SupportedCurrency, number>();
  for (const goal of goals) {
    if (goal.raised_amount > 0) {
      raisedByCurrency.set(
        goal.currency,
        (raisedByCurrency.get(goal.currency) ?? 0) + goal.raised_amount,
      );
    }
  }

  const displayName =
    profile?.display_name || t("overview.profileCard.fallbackName");

  const highlightName = (chunks: React.ReactNode) => (
    <span className="font-medium text-ink">{chunks}</span>
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("overview.title")}
      </h1>

      <div className="mt-8 space-y-6">
        <OnboardingChecklist state={state} />

        <DashboardStats
          locale={locale as AppLocale}
          supporters={supporters}
          journeyPosts={journeyPosts}
          topGoal={
            activeGoals[0]
              ? {
                  title: activeGoals[0].title,
                  raised: activeGoals[0].raised_amount,
                  target: activeGoals[0].target_amount,
                }
              : null
          }
        />

        {profile?.username ? (
          <section
            aria-label={t("overview.pageCard.ariaLabel")}
            className="rounded-3xl border border-forest/20 bg-forest/5 p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name || profile.username}
                  size="md"
                />
                <div>
                  <h2 className="font-serif text-lg font-semibold text-forest">
                    {t("overview.pageCard.title")}
                  </h2>
                  <p className="mt-0.5 text-sm text-ink/75">
                    buymeatee.com/t/{profile.username}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyLinkButton username={profile.username} />
                <ShareControls
                  url={`${siteConfig.url.replace(/\/$/, "")}/t/${profile.username}`}
                  text={pageShareText()}
                  showCopy={false}
                  buttonLabel={t("overview.pageCard.sharePage")}
                  size="md"
                />
                <Link
                  href={`/t/${profile.username}`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  {t("overview.pageCard.viewPage")}
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CardShell
            title={t("overview.profileCard.title")}
            href="/settings/profile"
            linkLabel={t("overview.profileCard.link")}
          >
            {state.profileUnavailable ? (
              <p>{t("overview.profileCard.unavailable")}</p>
            ) : profile?.username ? (
              <p>
                {t.rich(
                  profile.bio
                    ? "overview.profileCard.summaryWithBio"
                    : "overview.profileCard.summaryNoBio",
                  {
                    displayName,
                    username: profile.username,
                    name: highlightName,
                  },
                )}
              </p>
            ) : (
              <p>{t("overview.profileCard.noLink")}</p>
            )}
          </CardShell>

          <CardShell
            title={t("overview.goalsCard.title")}
            href="/dashboard/goals"
            linkLabel={t("overview.goalsCard.link")}
          >
            {state.goalsUnavailable ? (
              <p>{t("overview.goalsCard.unavailable")}</p>
            ) : activeGoals.length > 0 ? (
              <>
                <p>
                  {t.rich("overview.goalsCard.activeCount", {
                    count: activeGoals.length,
                    strong: highlightName,
                  })}
                </p>
                {raisedByCurrency.size > 0 ? (
                  <p className="mt-1">
                    {t("overview.goalsCard.raised", {
                      amounts: [...raisedByCurrency.entries()]
                        .map(([currency, amount]) =>
                          formatMinorAmount(
                            amount,
                            currency,
                            locale as AppLocale,
                          ),
                        )
                        .join(" + "),
                    })}
                  </p>
                ) : (
                  <p className="mt-1">{t("overview.goalsCard.noTees")}</p>
                )}
              </>
            ) : (
              <p>{t("overview.goalsCard.empty")}</p>
            )}
          </CardShell>

          <CardShell
            title={t("overview.wishlistCard.title")}
            href="/dashboard/wishlist"
            linkLabel={t("overview.wishlistCard.link")}
          >
            <p>{t("overview.wishlistCard.body")}</p>
          </CardShell>

          <CardShell
            title={t("overview.paymentsCard.title")}
            href={state.steps.paymentsReady ? "/dashboard/payments" : "/settings/payments"}
            linkLabel={
              state.steps.paymentsReady
                ? t("overview.paymentsCard.linkReady")
                : t("overview.paymentsCard.linkSetup")
            }
          >
            {state.paymentsUnavailable ? (
              <p>{t("overview.paymentsCard.unavailable")}</p>
            ) : (
              <p>
                {t.rich(
                  state.steps.paymentsReady
                    ? "overview.paymentsCard.ready"
                    : "overview.paymentsCard.notReady",
                  {
                    state: t(`paymentState.${state.paymentState}`),
                    strong: highlightName,
                  },
                )}
              </p>
            )}
          </CardShell>

          <CardShell
            title={t("overview.updatesCard.title")}
            href="/dashboard/journey"
            linkLabel={t("overview.updatesCard.link")}
          >
            <p>{t("overview.updatesCard.body")}</p>
          </CardShell>
        </div>
      </div>
    </main>
  );
}
