import { CircleCheck, CircleAlert, Clock, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConnectActions } from "@/components/payments/connect-actions";
import {
  getConnectedAccountForUser,
  syncConnectedAccount,
} from "@/lib/payments/connect";
import {
  canReceiveGifts,
  derivePaymentSetupState,
  type ConnectedAccountRow,
  type PaymentSetupState,
} from "@/lib/payments/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Payment settings",
  description: "Set up how you receive Tees through Stripe.",
  robots: { index: false, follow: false },
};

const SYNC_STALENESS_MS = 5 * 60 * 1000;

type StateCopy = {
  heading: string;
  body: string;
  tone: "neutral" | "good" | "attention" | "pending";
  onboardingLabel: string | null;
};

const stateCopy: Record<PaymentSetupState, StateCopy> = {
  not_started: {
    heading: "Payments not set up",
    body: "To receive Tees, connect a Stripe account. Stripe handles identity checks, bank details and payouts — BuyMeATee never holds your money.",
    tone: "neutral",
    onboardingLabel: "Set up payments with Stripe",
  },
  onboarding_not_started: {
    heading: "Stripe account created",
    body: "Your Stripe account exists but onboarding hasn't started. It only takes a few minutes.",
    tone: "neutral",
    onboardingLabel: "Start Stripe onboarding",
  },
  onboarding_incomplete: {
    heading: "Onboarding incomplete",
    body: "Stripe still needs a few details before you can receive Tees. Pick up where you left off.",
    tone: "attention",
    onboardingLabel: "Continue Stripe onboarding",
  },
  information_required: {
    heading: "Stripe needs more information",
    body: "Stripe has asked for additional information. Until it's provided, payments or payouts may be limited.",
    tone: "attention",
    onboardingLabel: "Provide the missing information",
  },
  verification_pending: {
    heading: "Verification in progress",
    body: "Your details are submitted and Stripe is verifying them. This usually completes quickly — check back soon.",
    tone: "pending",
    onboardingLabel: null,
  },
  ready: {
    heading: "Ready to receive Tees",
    body: "Your Stripe account is fully set up. Gifts go directly to your Stripe account and Stripe pays out to your bank on its schedule.",
    tone: "good",
    onboardingLabel: null,
  },
  payments_restricted: {
    heading: "Payments restricted",
    body: "Stripe has restricted this account, so it can't receive Tees at the moment. Open your Stripe dashboard for details, or contact Stripe support.",
    tone: "attention",
    onboardingLabel: "Review with Stripe",
  },
  payouts_disabled: {
    heading: "Payouts disabled",
    body: "Payments are possible but payouts to your bank are currently disabled. Stripe usually needs updated bank or identity details.",
    tone: "attention",
    onboardingLabel: "Update details with Stripe",
  },
};

const toneStyles: Record<StateCopy["tone"], string> = {
  neutral: "border-stone bg-white",
  good: "border-forest/25 bg-forest/5",
  attention: "border-amber-300 bg-amber-50",
  pending: "border-stone bg-mist",
};

function StateIcon({ tone }: { tone: StateCopy["tone"] }) {
  const classes = "h-6 w-6 shrink-0";
  switch (tone) {
    case "good":
      return <CircleCheck aria-hidden="true" className={`${classes} text-forest`} />;
    case "attention":
      return <CircleAlert aria-hidden="true" className={`${classes} text-amber-700`} />;
    case "pending":
      return <Clock aria-hidden="true" className={`${classes} text-ink/60`} />;
    default:
      return <Landmark aria-hidden="true" className={`${classes} text-forest`} />;
  }
}

async function loadAccount(userId: string): Promise<ConnectedAccountRow | null> {
  const account = await getConnectedAccountForUser(userId);
  if (!account) {
    return null;
  }
  const lastSynced = account.last_synced_at
    ? new Date(account.last_synced_at).getTime()
    : 0;
  if (Date.now() - lastSynced < SYNC_STALENESS_MS) {
    return account;
  }
  try {
    return (await syncConnectedAccount(account.stripe_account_id)) ?? account;
  } catch {
    // Stripe temporarily unreachable: show the last known state honestly.
    return account;
  }
}

export default async function PaymentSettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fsettings%2Fpayments");
  }

  let account: ConnectedAccountRow | null = null;
  let unavailable = false;
  try {
    account = await loadAccount(user.id);
  } catch {
    unavailable = true;
  }

  const state = derivePaymentSetupState(account);
  const copy = stateCopy[state];
  const ready = canReceiveGifts(account);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        Settings
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Payments
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        Receiving Tees runs on Stripe. Stripe may ask for identity or bank
        information — that&apos;s part of keeping payments safe.
      </p>

      {unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          Payment settings aren&apos;t available right now. Please try again
          shortly.
        </div>
      ) : (
        <section
          aria-label="Payment setup status"
          className={`mt-8 rounded-3xl border p-6 sm:p-8 ${toneStyles[copy.tone]}`}
        >
          <div className="flex items-start gap-3">
            <StateIcon tone={copy.tone} />
            <div>
              <h2 className="font-serif text-xl font-semibold text-forest">
                {copy.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                {copy.body}
              </p>
              {account ? (
                <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm text-ink/70 sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink/80">Country:</dt>
                    <dd>{account.country}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink/80">Receiving Tees:</dt>
                    <dd>{ready ? "Yes" : "Not yet"}</dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
          <div className="mt-6">
            <ConnectActions
              onboardingLabel={copy.onboardingLabel}
              showDashboardLink={Boolean(account?.details_submitted)}
            />
          </div>
        </section>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink/60">
        Payouts are handled by Stripe, not BuyMeATee. A gift being paid means
        it reached your Stripe account — payout timing to your bank follows
        your Stripe payout schedule.
      </p>
    </main>
  );
}
