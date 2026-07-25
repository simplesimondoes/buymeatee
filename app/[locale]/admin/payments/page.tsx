import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import {
  AdminRefundForm,
  ReconcileButton,
} from "@/components/payments/admin-tools";
import { formatDateTime, formatMinorAmount } from "@/lib/i18n/format";
import {
  isAdmin,
  listReconciliationErrors,
  searchGifts,
} from "@/lib/payments/admin";
import { GIFT_STATUSES, type GiftRow } from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "admin",
  });
  return {
    title: t("meta.payments.title"),
    robots: { index: false, follow: false },
  };
}

function stripeDashboardUrl(gift: GiftRow): string | null {
  if (!gift.stripe_payment_intent_id) {
    return null;
  }
  const base = gift.livemode
    ? "https://dashboard.stripe.com"
    : "https://dashboard.stripe.com/test";
  return `${base}/payments/${gift.stripe_payment_intent_id}`;
}

async function usernamesFor(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) {
    return map;
  }
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", [...new Set(userIds)]);
  for (const row of data ?? []) {
    map.set(row.id as string, (row.username ?? row.display_name) as string);
  }
  return map;
}

/**
 * Platform payments admin. Access is enforced server-side against
 * admin_users on every request — there is no client-side-only gating.
 */
export default async function AdminPaymentsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale } = await routeParams;
  const appLocale = locale as AppLocale;
  setRequestLocale(appLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/admin/payments`)}`,
      locale: appLocale,
    });
  }
  if (!(await isAdmin(user.id))) {
    // Admins-only: everyone else sees a plain 404, not a hint.
    notFound();
  }

  const t = await getTranslations({ locale: appLocale, namespace: "admin" });

  const params = await searchParams;
  const status = GIFT_STATUSES.includes(params.status as never)
    ? params.status
    : undefined;

  let gifts: GiftRow[] = [];
  let reconciliationErrors: GiftRow[] = [];
  let loadError = false;
  try {
    [gifts, reconciliationErrors] = await Promise.all([
      searchGifts({ query: params.q, status }),
      listReconciliationErrors(),
    ]);
  } catch {
    loadError = true;
  }

  const names = await usernamesFor([
    ...gifts.map((gift) => gift.recipient_user_id),
    ...reconciliationErrors.map((gift) => gift.recipient_user_id),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("common.eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest">
        {t("payments.title")}
      </h1>

      <section className="mt-6 rounded-3xl border border-stone bg-white p-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <label htmlFor="admin-q" className="text-sm font-medium text-forest">
              {t("payments.searchLabel")}
            </label>
            <input
              id="admin-q"
              name="q"
              defaultValue={params.q ?? ""}
              className="mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink focus:border-forest"
            />
          </div>
          <div>
            <label htmlFor="admin-status" className="text-sm font-medium text-forest">
              {t("payments.statusLabel")}
            </label>
            <select
              id="admin-status"
              name="status"
              defaultValue={status ?? ""}
              className="mt-1.5 rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink focus:border-forest"
            >
              <option value="">{t("payments.statusAll")}</option>
              {GIFT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`statuses.gift.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            {t("common.search")}
          </button>
        </form>
      </section>

      {loadError ? (
        <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-900">
          {t("payments.unavailable")}
        </p>
      ) : (
        <>
          {reconciliationErrors.length > 0 ? (
            <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
              <h2 className="font-serif text-lg font-semibold text-red-900">
                {t("payments.reconciliationErrorsHeading")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-red-900">
                {reconciliationErrors.map((gift) => (
                  <li key={gift.id}>
                    <code className="text-xs">{gift.public_id}</code> ·{" "}
                    {names.get(gift.recipient_user_id) ?? gift.recipient_user_id} ·{" "}
                    {formatMinorAmount(gift.total_amount, gift.currency, appLocale)} —{" "}
                    {gift.reconciliation_error}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6 overflow-x-auto rounded-3xl border border-stone bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-forest">
              {params.q
                ? t("payments.giftsHeadingMatching", { query: params.q })
                : t("payments.giftsHeading")}
            </h2>
            <table className="mt-4 w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-ink/60">
                  <th className="py-2 pr-4">{t("payments.table.created")}</th>
                  <th className="py-2 pr-4">{t("payments.table.publicId")}</th>
                  <th className="py-2 pr-4">{t("payments.table.recipient")}</th>
                  <th className="py-2 pr-4">{t("payments.table.sender")}</th>
                  <th className="py-2 pr-4">{t("payments.table.gift")}</th>
                  <th className="py-2 pr-4">{t("payments.table.platformFee")}</th>
                  <th className="py-2 pr-4">{t("payments.table.total")}</th>
                  <th className="py-2 pr-4">{t("payments.table.status")}</th>
                  <th className="py-2 pr-4">{t("payments.table.refunded")}</th>
                  <th className="py-2">{t("payments.table.stripe")}</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift) => {
                  const dashboardUrl = stripeDashboardUrl(gift);
                  return (
                    <tr key={gift.id} className="border-b border-stone/60 align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatDateTime(gift.created_at, appLocale)}
                      </td>
                      <td className="py-2 pr-4">
                        <code className="text-xs">{gift.public_id}</code>
                      </td>
                      <td className="py-2 pr-4">
                        {names.get(gift.recipient_user_id) ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {gift.is_anonymous
                          ? t("payments.anonymousSender")
                          : gift.sender_name}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMinorAmount(gift.gift_amount, gift.currency, appLocale)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMinorAmount(
                          gift.application_fee_amount,
                          gift.currency,
                          appLocale,
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMinorAmount(gift.total_amount, gift.currency, appLocale)}
                      </td>
                      <td className="py-2 pr-4">
                        {t(`statuses.gift.${gift.status}`)}
                        {gift.livemode ? "" : ` ${t("payments.testMode")}`}
                      </td>
                      <td className="py-2 pr-4">
                        {gift.amount_refunded > 0
                          ? formatMinorAmount(
                              gift.amount_refunded,
                              gift.currency,
                              appLocale,
                            )
                          : "—"}
                      </td>
                      <td className="py-2">
                        {dashboardUrl ? (
                          <a
                            href={dashboardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-forest underline hover:text-forest-dark"
                          >
                            {t("payments.openInStripe")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {gifts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-ink/60">
                      {t("payments.empty")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-stone bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-forest">
                {t("payments.refund.heading")}
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                {t("payments.refund.description")}
              </p>
              <div className="mt-4">
                <AdminRefundForm />
              </div>
            </div>
            <div className="rounded-3xl border border-stone bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-forest">
                {t("payments.reconcile.heading")}
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                {t("payments.reconcile.description")}
              </p>
              <div className="mt-4">
                <ReconcileButton />
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
