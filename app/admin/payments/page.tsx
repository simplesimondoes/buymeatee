import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  AdminRefundForm,
  ReconcileButton,
} from "@/components/payments/admin-tools";
import {
  isAdmin,
  listReconciliationErrors,
  searchGifts,
} from "@/lib/payments/admin";
import { formatMinorAmount } from "@/lib/payments/currency";
import { GIFT_STATUSES, type GiftRow } from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Payments admin",
  robots: { index: false, follow: false },
};

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
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fadmin%2Fpayments");
  }
  if (!(await isAdmin(user.id))) {
    // Admins-only: everyone else sees a plain 404, not a hint.
    notFound();
  }

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
        Admin
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest">
        Payments
      </h1>

      <section className="mt-6 rounded-3xl border border-stone bg-white p-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <label htmlFor="admin-q" className="text-sm font-medium text-forest">
              Search (gift public id, cs_…, pi_…, or recipient username)
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
              Status
            </label>
            <select
              id="admin-status"
              name="status"
              defaultValue={status ?? ""}
              className="mt-1.5 rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink focus:border-forest"
            >
              <option value="">All</option>
              {GIFT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            Search
          </button>
        </form>
      </section>

      {loadError ? (
        <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-900">
          Payment data isn&apos;t available right now.
        </p>
      ) : (
        <>
          {reconciliationErrors.length > 0 ? (
            <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
              <h2 className="font-serif text-lg font-semibold text-red-900">
                Reconciliation errors — manual review required
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-red-900">
                {reconciliationErrors.map((gift) => (
                  <li key={gift.id}>
                    <code className="text-xs">{gift.public_id}</code> ·{" "}
                    {names.get(gift.recipient_user_id) ?? gift.recipient_user_id} ·{" "}
                    {formatMinorAmount(gift.total_amount, gift.currency)} —{" "}
                    {gift.reconciliation_error}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6 overflow-x-auto rounded-3xl border border-stone bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-forest">
              Gifts {params.q ? `matching “${params.q}”` : "(latest)"}
            </h2>
            <table className="mt-4 w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-ink/60">
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Public id</th>
                  <th className="py-2 pr-4">Recipient</th>
                  <th className="py-2 pr-4">Sender</th>
                  <th className="py-2 pr-4">Gift</th>
                  <th className="py-2 pr-4">Platform fee</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Refunded</th>
                  <th className="py-2">Stripe</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift) => {
                  const dashboardUrl = stripeDashboardUrl(gift);
                  return (
                    <tr key={gift.id} className="border-b border-stone/60 align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(gift.created_at).toLocaleString("en-GB")}
                      </td>
                      <td className="py-2 pr-4">
                        <code className="text-xs">{gift.public_id}</code>
                      </td>
                      <td className="py-2 pr-4">
                        {names.get(gift.recipient_user_id) ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {gift.is_anonymous ? "(anonymous)" : gift.sender_name}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMinorAmount(gift.gift_amount, gift.currency)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMinorAmount(gift.application_fee_amount, gift.currency)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatMinorAmount(gift.total_amount, gift.currency)}
                      </td>
                      <td className="py-2 pr-4">
                        {gift.status}
                        {gift.livemode ? "" : " (test)"}
                      </td>
                      <td className="py-2 pr-4">
                        {gift.amount_refunded > 0
                          ? formatMinorAmount(gift.amount_refunded, gift.currency)
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
                            Open
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
                      No gifts found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-stone bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-forest">
                Refund a gift
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                Full refunds only (MVP): reverses the recipient transfer and
                refunds the platform fee. Confirmed by webhook.
              </p>
              <div className="mt-4">
                <AdminRefundForm />
              </div>
            </div>
            <div className="rounded-3xl border border-stone bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-forest">
                Reconciliation
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                Checks gifts stuck in draft / awaiting payment / processing
                against Stripe and repairs safe drift.
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
