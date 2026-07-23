import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { UserStatusActions } from "@/components/admin/user-status-actions";
import { getUserAdminDetail } from "@/lib/admin/users";
import { formatMinorAmount } from "@/lib/payments/currency";
import { canReceiveGifts, derivePaymentSetupState } from "@/lib/payments/types";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "User admin",
  robots: { index: false, follow: false },
};

/** One operational view per user: profile, goals, Stripe status, gift totals, audit trail. */
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fadmin%2Fusers");
  }
  if (!(await isAdmin(user.id))) {
    notFound();
  }

  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    notFound();
  }
  const detail = await getUserAdminDetail(userId).catch(() => null);
  if (!detail) {
    notFound();
  }
  const { profile, goals, account, giftTotals, recentActions } = detail;
  const paymentState = derivePaymentSetupState(account);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        <Link href="/admin/users" className="hover:text-forest">
          Admin · Users
        </Link>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold text-forest">
          {profile.display_name || "(no name)"}
        </h1>
        {profile.deactivated_at ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
            Deactivated {new Date(profile.deactivated_at).toLocaleString("en-GB")}
          </span>
        ) : (
          <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
            Active
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-label="Profile" className="rounded-3xl border border-stone bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-forest">Profile</h2>
          <dl className="mt-3 space-y-1.5 text-sm text-ink/80">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">User id</dt>
              <dd className="break-all">{profile.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Public link</dt>
              <dd>
                {profile.username ? (
                  <Link
                    href={`/t/${profile.username}`}
                    className="text-forest underline underline-offset-2"
                  >
                    /t/{profile.username}
                  </Link>
                ) : (
                  "not claimed"
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Role</dt>
              <dd>{profile.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Country</dt>
              <dd>{profile.country ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Bio</dt>
              <dd className="whitespace-pre-wrap">{profile.bio ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Joined</dt>
              <dd>{new Date(profile.created_at).toLocaleString("en-GB")}</dd>
            </div>
          </dl>
        </section>

        <section aria-label="Payments" className="rounded-3xl border border-stone bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-forest">Payments</h2>
          <dl className="mt-3 space-y-1.5 text-sm text-ink/80">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Stripe state</dt>
              <dd>
                {paymentState}
                {canReceiveGifts(account) ? " (can receive Tees)" : ""}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-ink/60">Tees received</dt>
              <dd>
                {giftTotals.length === 0
                  ? "none"
                  : giftTotals
                      .map(
                        (total) =>
                          `${total.count} · ${formatMinorAmount(total.amount, total.currency)}`,
                      )
                      .join("  +  ")}
              </dd>
            </div>
          </dl>

          <h3 className="mt-5 font-serif text-base font-semibold text-forest">
            Goals ({goals.length})
          </h3>
          {goals.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">No goals.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              {goals.map((goal) => (
                <li key={goal.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-ink/60">
                    {goal.status} · {formatMinorAmount(goal.raised_amount, goal.currency)} of{" "}
                    {formatMinorAmount(goal.target_amount, goal.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        aria-label="Actions"
        className="mt-6 rounded-3xl border border-stone bg-white p-6"
      >
        <h2 className="font-serif text-lg font-semibold text-forest">
          {profile.deactivated_at ? "Reinstate" : "Deactivate"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">
          {profile.deactivated_at
            ? "Reinstating restores the public page and the ability to receive Tees."
            : "Deactivating hides the public page and blocks new Tees. Settled payments and payouts are untouched."}
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
              Audit trail
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
              {recentActions.map((action) => (
                <li key={action.id}>
                  <span className="font-medium">{action.action}</span>{" "}
                  — {action.reason}{" "}
                  <span className="text-ink/50">
                    ({new Date(action.created_at).toLocaleString("en-GB")})
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
