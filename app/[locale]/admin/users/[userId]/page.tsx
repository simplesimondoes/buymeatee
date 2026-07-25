import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";

import { UserStatusActions } from "@/components/admin/user-status-actions";
import { getUserAdminDetail } from "@/lib/admin/users";
import { formatDateTime, formatMinorAmount } from "@/lib/i18n/format";
import { canReceiveGifts, derivePaymentSetupState } from "@/lib/payments/types";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "admin",
  });
  return {
    title: t("meta.userDetail.title"),
    robots: { index: false, follow: false },
  };
}

/** One operational view per user: profile, goals, Stripe status, gift totals, audit trail. */
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;
  const appLocale = locale as AppLocale;
  setRequestLocale(appLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/admin/users`)}`,
      locale: appLocale,
    });
  }
  if (!(await isAdmin(user.id))) {
    notFound();
  }

  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    notFound();
  }
  const detail = await getUserAdminDetail(userId).catch(() => null);
  if (!detail) {
    notFound();
  }
  const { profile, goals, account, giftTotals, recentActions } = detail;
  const paymentState = derivePaymentSetupState(account);

  const t = await getTranslations({ locale: appLocale, namespace: "admin" });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        <Link href="/admin/users" className="hover:text-forest">
          {t("userDetail.breadcrumb")}
        </Link>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold text-forest">
          {profile.display_name || t("common.noName")}
        </h1>
        {profile.deactivated_at ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
            {t("userDetail.deactivatedOn", {
              date: formatDateTime(profile.deactivated_at, appLocale),
            })}
          </span>
        ) : (
          <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
            {t("statuses.account.active")}
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section
          aria-label={t("userDetail.profileHeading")}
          className="rounded-3xl border border-stone bg-white p-6"
        >
          <h2 className="font-serif text-lg font-semibold text-forest">
            {t("userDetail.profileHeading")}
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm text-ink/80">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.fields.userId")}
              </dt>
              <dd className="break-all">{profile.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.fields.publicLink")}
              </dt>
              <dd>
                {profile.username ? (
                  <Link
                    href={`/t/${profile.username}`}
                    className="text-forest underline underline-offset-2"
                  >
                    /t/{profile.username}
                  </Link>
                ) : (
                  t("userDetail.linkNotClaimed")
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.fields.role")}
              </dt>
              <dd>{t(`statuses.role.${profile.role}`)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.fields.country")}
              </dt>
              <dd>{profile.country ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.fields.bio")}
              </dt>
              <dd className="whitespace-pre-wrap">{profile.bio ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.fields.joined")}
              </dt>
              <dd>{formatDateTime(profile.created_at, appLocale)}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-label={t("userDetail.paymentsHeading")}
          className="rounded-3xl border border-stone bg-white p-6"
        >
          <h2 className="font-serif text-lg font-semibold text-forest">
            {t("userDetail.paymentsHeading")}
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm text-ink/80">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.stripeState")}
              </dt>
              <dd>
                {t(`statuses.payment.${paymentState}`)}
                {canReceiveGifts(account)
                  ? ` ${t("userDetail.canReceiveTees")}`
                  : ""}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">
                {t("userDetail.teesReceived")}
              </dt>
              <dd>
                {giftTotals.length === 0
                  ? t("userDetail.teesNone")
                  : giftTotals
                      .map((total) =>
                        t("userDetail.teeTotal", {
                          count: total.count,
                          amount: formatMinorAmount(
                            total.amount,
                            total.currency,
                            appLocale,
                          ),
                        }),
                      )
                      .join("  +  ")}
              </dd>
            </div>
          </dl>

          <h3 className="mt-5 font-serif text-base font-semibold text-forest">
            {t("userDetail.goalsHeading", { count: goals.length })}
          </h3>
          {goals.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">{t("userDetail.goalsEmpty")}</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              {goals.map((goal) => (
                <li key={goal.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-ink/60">
                    {t(`statuses.goal.${goal.status}`)} ·{" "}
                    {t("userDetail.goalProgress", {
                      raised: formatMinorAmount(
                        goal.raised_amount,
                        goal.currency,
                        appLocale,
                      ),
                      target: formatMinorAmount(
                        goal.target_amount,
                        goal.currency,
                        appLocale,
                      ),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        aria-label={t("userDetail.actionsLabel")}
        className="mt-6 rounded-3xl border border-stone bg-white p-6"
      >
        <h2 className="font-serif text-lg font-semibold text-forest">
          {profile.deactivated_at
            ? t("userDetail.reinstateHeading")
            : t("userDetail.deactivateHeading")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">
          {profile.deactivated_at
            ? t("userDetail.reinstateDescription")
            : t("userDetail.deactivateDescription")}
        </p>
        <div className="mt-4 max-w-md">
          <UserStatusActions
            userId={profile.id}
            isDeactivated={Boolean(profile.deactivated_at)}
          />
        </div>

        {recentActions.length > 0 ? (
          <>
            <h3 className="mt-6 font-serif text-base font-semibold text-forest">
              {t("userDetail.auditHeading")}
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
              {recentActions.map((action) => (
                <li key={action.id}>
                  <span className="font-medium">{action.action}</span>{" "}
                  — {action.reason}{" "}
                  <span className="text-ink/50">
                    ({formatDateTime(action.created_at, appLocale)})
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </main>
  );
}
