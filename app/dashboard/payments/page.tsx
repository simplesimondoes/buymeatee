import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConnectActions } from "@/components/payments/connect-actions";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";
import {
  canReceiveGifts,
  derivePaymentSetupState,
  PAID_FAMILY_STATUSES,
  type ConnectedAccountRow,
  type GiftStatus,
} from "@/lib/payments/types";
import {
  getAuthenticatedUser,
  getSupabaseServerClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tees received",
  description: "Gifts received through your BuyMeATee page.",
  robots: { index: false, follow: false },
};

type ReceivedGift = {
  id: string;
  sender_name: string;
  is_anonymous: boolean;
  message: string | null;
  currency: SupportedCurrency;
  gift_amount: number;
  amount_refunded: number;
  status: GiftStatus;
  paid_at: string | null;
  created_at: string;
};

const statusLabels: Partial<Record<GiftStatus, string>> = {
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  disputed: "Disputed",
  dispute_won: "Dispute won",
  dispute_lost: "Dispute lost",
  processing: "Processing",
  payment_failed: "Payment failed",
  expired: "Expired",
  checkout_created: "Awaiting payment",
  cancelled: "Cancelled",
};

export default async function PaymentsDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fdashboard%2Fpayments");
  }

  // Gifts are read with the user-scoped client: RLS restricts rows to this
  // recipient and column grants restrict fields to the safe set.
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("gifts")
    .select(
      "id, sender_name, is_anonymous, message, currency, gift_amount, amount_refunded, status, paid_at, created_at",
    )
    .eq("recipient_user_id", user.id)
    // Only money that arrived (or is arriving) — not abandoned checkouts.
    .in("status", [...PAID_FAMILY_STATUSES, "processing"])
    .order("created_at", { ascending: false })
    .limit(100);
  const gifts = (data ?? []) as ReceivedGift[];

  let account: ConnectedAccountRow | null = null;
  try {
    account = await getConnectedAccountForUser(user.id);
  } catch {
    account = null;
  }
  const setupState = derivePaymentSetupState(account);
  const ready = canReceiveGifts(account);

  const paidGifts = gifts.filter((gift) =>
    PAID_FAMILY_STATUSES.includes(gift.status),
  );
  const grossByCurrency = new Map<SupportedCurrency, number>();
  for (const gift of paidGifts) {
    grossByCurrency.set(
      gift.currency,
      (grossByCurrency.get(gift.currency) ?? 0) + gift.gift_amount,
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        Dashboard
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Tees received
      </h1>

      <section
        aria-label="Payment status"
        className="mt-8 rounded-3xl border border-stone bg-white p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-forest">
              {ready ? "Receiving Tees" : "Not receiving Tees yet"}
            </h2>
            <p className="mt-1 text-sm text-ink/70">
              {ready
                ? "Payments are enabled. Stripe pays out to your bank on your Stripe payout schedule."
                : setupState === "not_started"
                  ? "Set up payments to start receiving Tees."
                  : "Your payment setup needs attention."}
            </p>
          </div>
          {ready && account?.details_submitted ? (
            <ConnectActions onboardingLabel={null} showDashboardLink />
          ) : (
            <Link
              href="/settings/payments"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
            >
              Payment settings
            </Link>
          )}
        </div>
        {grossByCurrency.size > 0 ? (
          <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-2 border-t border-stone pt-5">
            {[...grossByCurrency.entries()].map(([currency, total]) => (
              <div key={currency}>
                <dt className="text-xs uppercase tracking-wide text-ink/60">
                  Gross Tee value ({currency.toUpperCase()})
                </dt>
                <dd className="mt-0.5 font-serif text-2xl font-semibold text-forest">
                  {formatMinorAmount(total, currency)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="mt-4 text-xs leading-relaxed text-ink/60">
          Gift amounts are what senders chose for you. Stripe handles payouts —
          a paid Tee is in your Stripe account, not necessarily in your bank
          yet.
        </p>
      </section>

      <section aria-label="Gifts received" className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-forest">
          Latest Tees
        </h2>
        {gifts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-stone bg-mist p-6 text-sm text-ink/70">
            No Tees yet. Share your page to let supporters join your journey.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {gifts.map((gift) => (
              <li
                key={gift.id}
                className="rounded-2xl border border-stone bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    {gift.is_anonymous ? "Anonymous" : gift.sender_name}
                    <span className="ml-2 font-serif text-lg font-semibold text-forest">
                      {formatMinorAmount(gift.gift_amount, gift.currency)}
                    </span>
                  </p>
                  <p className="text-xs text-ink/60">
                    {statusLabels[gift.status] ?? gift.status} ·{" "}
                    {new Date(gift.paid_at ?? gift.created_at).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </p>
                </div>
                {gift.message ? (
                  <blockquote className="mt-2 text-sm italic leading-relaxed text-ink/75">
                    “{gift.message}”
                  </blockquote>
                ) : null}
                {gift.amount_refunded > 0 ? (
                  <p className="mt-2 text-xs text-amber-800">
                    {formatMinorAmount(gift.amount_refunded, gift.currency)} of
                    the payment was refunded.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
