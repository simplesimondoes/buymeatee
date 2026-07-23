import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/profile/avatar";
import { CopyLinkButton } from "@/components/profile/copy-link-button";
import { OnboardingChecklist } from "@/components/profile/onboarding-checklist";
import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";
import type { PaymentSetupState } from "@/lib/payments/types";
import { getCreatorSetupState } from "@/lib/profile/setup-state";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your journey at a glance.",
  robots: { index: false, follow: false },
};

const paymentStateLabels: Record<PaymentSetupState, string> = {
  not_started: "Not set up yet",
  onboarding_not_started: "Stripe onboarding not started",
  onboarding_incomplete: "Stripe onboarding incomplete",
  information_required: "Stripe needs more information",
  verification_pending: "Stripe verification in progress",
  ready: "Ready to receive Tees",
  payments_restricted: "Restricted — review with Stripe",
  payouts_disabled: "Payouts currently disabled",
};

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

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fdashboard");
  }

  const state = await getCreatorSetupState(user.id);
  const { profile, goals } = state;

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

  const displayName = profile?.display_name || "your profile";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        Dashboard
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Your journey
      </h1>

      <div className="mt-8 space-y-6">
        <OnboardingChecklist state={state} />

        {profile?.username ? (
          <section
            aria-label="Your public page"
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
                    Your page is where Tees happen
                  </h2>
                  <p className="mt-0.5 text-sm text-ink/75">
                    buymeatee.com/t/{profile.username}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyLinkButton username={profile.username} />
                <Link
                  href={`/t/${profile.username}`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  View page
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CardShell title="Profile" href="/settings/profile" linkLabel="Edit profile">
            {state.profileUnavailable ? (
              <p>Profile details aren&apos;t available right now.</p>
            ) : profile?.username ? (
              <p>
                You&apos;re <span className="font-medium text-ink">{displayName}</span>{" "}
                at <span className="font-medium text-ink">/t/{profile.username}</span>
                {profile.bio ? " — bio in place." : " — no bio yet."}
              </p>
            ) : (
              <p>
                No public link yet. Claim your buymeatee.com/t/ name so
                supporters can find you.
              </p>
            )}
          </CardShell>

          <CardShell title="Goals" href="/dashboard/goals" linkLabel="Manage goals">
            {state.goalsUnavailable ? (
              <p>Goals aren&apos;t available right now.</p>
            ) : activeGoals.length > 0 ? (
              <>
                <p>
                  <span className="font-medium text-ink">
                    {activeGoals.length}
                  </span>{" "}
                  active {activeGoals.length === 1 ? "goal" : "goals"} on your
                  page.
                </p>
                {raisedByCurrency.size > 0 ? (
                  <p className="mt-1">
                    {[...raisedByCurrency.entries()]
                      .map(([currency, amount]) =>
                        formatMinorAmount(amount, currency),
                      )
                      .join(" + ")}{" "}
                    raised across your goals.
                  </p>
                ) : (
                  <p className="mt-1">No Tees toward goals yet.</p>
                )}
              </>
            ) : (
              <p>
                No goals on your page yet. Goals give supporters something
                real to back.
              </p>
            )}
          </CardShell>

          <CardShell
            title="Payments"
            href={state.steps.paymentsReady ? "/dashboard/payments" : "/settings/payments"}
            linkLabel={state.steps.paymentsReady ? "See Tees received" : "Payment settings"}
          >
            {state.paymentsUnavailable ? (
              <p>Payment status isn&apos;t available right now.</p>
            ) : (
              <p>
                <span className="font-medium text-ink">
                  {paymentStateLabels[state.paymentState]}
                </span>
                {state.steps.paymentsReady
                  ? " — Tees go straight to your Stripe account."
                  : " — supporters can't send Tees until this is done."}
              </p>
            )}
          </CardShell>
        </div>
      </div>
    </main>
  );
}
