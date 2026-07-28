import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";

import { ConnectActions } from "@/components/payments/connect-actions";
import { ShareControls } from "@/components/share-controls";
import { supportShareText } from "@/lib/goals/share";
import { siteConfig } from "@/lib/site";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import { formatDate, formatMinorAmount } from "@/lib/i18n/format";
import type { SupportedCurrency } from "@/lib/payments/currency";
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
    title: t("meta.payments.title"),
    description: t("meta.payments.description"),
    robots: { index: false, follow: false },
  };
}

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
  goal_id: string | null;
  wishlist_item_id: string | null;
};


export default async function PaymentsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const appLocale = locale as AppLocale;
  const t = await getTranslations({
    locale: appLocale,
    namespace: "dashboard",
  });

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/dashboard/payments`)}`,
      locale: appLocale,
    });
  }

  // Gifts are read with the user-scoped client: RLS restricts rows to this
  // recipient and column grants restrict fields to the safe set.
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("gifts")
    .select(
      "id, sender_name, is_anonymous, message, currency, gift_amount, amount_refunded, status, paid_at, created_at, goal_id, wishlist_item_id",
    )
    .eq("recipient_user_id", user.id)
    // Only money that arrived (or is arriving) — not abandoned checkouts.
    .in("status", [...PAID_FAMILY_STATUSES, "processing"])
    .order("created_at", { ascending: false })
    .limit(100);
  const gifts = (data ?? []) as ReceivedGift[];

  // The creator's public link — where a "share this support" post points, so
  // their audience lands on the page they can support from.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  const username = (profileRow as { username: string | null } | null)?.username ?? null;
  const profileUrl = username
    ? `${siteConfig.url.replace(/\/$/, "")}/t/${username}`
    : null;

  // Resolve the goal / wish-list titles these Tees were put toward, so each
  // row can show what it funded (the creator's own rows, user-scoped client).
  const goalTitles = new Map<string, string>();
  const itemTitles = new Map<string, string>();
  if (gifts.some((gift) => gift.goal_id)) {
    const { data: goalRows } = await supabase
      .from("creator_goals")
      .select("id, title")
      .eq("creator_id", user.id);
    for (const row of (goalRows ?? []) as { id: string; title: string }[]) {
      goalTitles.set(row.id, row.title);
    }
  }
  if (gifts.some((gift) => gift.wishlist_item_id)) {
    const { data: itemRows } = await supabase
      .from("wishlist_items")
      .select("id, title")
      .eq("creator_id", user.id);
    for (const row of (itemRows ?? []) as { id: string; title: string }[]) {
      itemTitles.set(row.id, row.title);
    }
  }

  function giftTarget(
    gift: ReceivedGift,
  ): { label: string; toward: boolean } | null {
    if (gift.goal_id) {
      return {
        label: goalTitles.get(gift.goal_id) ?? t("payments.fallbackGoal"),
        toward: true,
      };
    }
    if (gift.wishlist_item_id) {
      return {
        label:
          itemTitles.get(gift.wishlist_item_id) ?? t("payments.fallbackItem"),
        toward: false,
      };
    }
    return null;
  }

  function giftStatusLabel(status: GiftStatus): string {
    // Every status a supporter can see has a label; "draft" never renders
    // here (the query filters to paid-family + processing).
    return status === "draft" ? status : t(`payments.giftStatus.${status}`);
  }

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

  // How paid support splits across what it funded.
  const towardGoals = paidGifts.filter((gift) => gift.goal_id).length;
  const towardWishlist = paidGifts.filter((gift) => gift.wishlist_item_id).length;
  const generalSupport = paidGifts.length - towardGoals - towardWishlist;
  const attributionSummary = [
    towardGoals > 0
      ? t("payments.attribution.towardGoals", { count: towardGoals })
      : null,
    towardWishlist > 0
      ? t("payments.attribution.towardWishlist", { count: towardWishlist })
      : null,
    generalSupport > 0
      ? t("payments.attribution.general", { count: generalSupport })
      : null,
  ].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("payments.title")}
      </h1>

      <section
        aria-label={t("payments.statusAria")}
        className="mt-8 rounded-3xl border border-stone bg-white p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-forest">
              {ready ? t("payments.receiving") : t("payments.notReceiving")}
            </h2>
            <p className="mt-1 text-sm text-ink/70">
              {ready
                ? t("payments.readyBody")
                : setupState === "not_started"
                  ? t("payments.setupBody")
                  : t("payments.attentionBody")}
            </p>
          </div>
          {ready && account?.details_submitted ? (
            <ConnectActions onboardingLabel={null} showDashboardLink />
          ) : (
            <Link
              href="/settings/payments"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
            >
              {t("payments.paymentSettings")}
            </Link>
          )}
        </div>
        {grossByCurrency.size > 0 ? (
          <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-2 border-t border-stone pt-5">
            {[...grossByCurrency.entries()].map(([currency, total]) => (
              <div key={currency}>
                <dt className="text-xs uppercase tracking-wide text-ink/70">
                  {t("payments.grossLabel", {
                    currency: currency.toUpperCase(),
                  })}
                </dt>
                <dd className="mt-0.5 font-serif text-2xl font-semibold text-forest">
                  {formatMinorAmount(total, currency, appLocale)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="mt-4 text-xs leading-relaxed text-ink/70">
          {t("payments.payoutNote")}
        </p>
      </section>

      <section aria-label={t("payments.giftsAria")} className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-forest">
          {t("payments.latestTees")}
        </h2>
        {attributionSummary.length > 0 ? (
          <p className="mt-1 text-sm text-ink/70">
            {attributionSummary.join(" · ")}
          </p>
        ) : null}
        {gifts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-stone bg-mist p-6 text-sm text-ink/70">
            {t("payments.empty")}
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
                    {gift.is_anonymous
                      ? t("payments.anonymous")
                      : gift.sender_name}
                    <span className="ml-2 font-serif text-lg font-semibold text-forest">
                      {formatMinorAmount(gift.gift_amount, gift.currency, appLocale)}
                    </span>
                  </p>
                  <p className="text-xs text-ink/70">
                    {giftStatusLabel(gift.status)} ·{" "}
                    {formatDate(gift.paid_at ?? gift.created_at, appLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {(() => {
                  const target = giftTarget(gift);
                  return target ? (
                    <p className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
                        {target.toward
                          ? t("payments.toward", { title: target.label })
                          : t("payments.funded", { title: target.label })}
                      </span>
                    </p>
                  ) : null;
                })()}
                {gift.message ? (
                  <blockquote className="mt-2 text-sm italic leading-relaxed text-ink/75">
                    “{gift.message}”
                  </blockquote>
                ) : null}
                {gift.amount_refunded > 0 ? (
                  <p className="mt-2 text-xs text-amber-800">
                    {t("payments.refundedNote", {
                      amount: formatMinorAmount(
                        gift.amount_refunded,
                        gift.currency,
                        appLocale,
                      ),
                    })}
                  </p>
                ) : null}
                {profileUrl &&
                gift.status === "paid" &&
                gift.amount_refunded === 0 ? (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone pt-3">
                    <p className="text-xs text-ink/55">
                      {t("payments.shareNews")}
                    </p>
                    <ShareControls
                      url={profileUrl}
                      text={supportShareText(giftTarget(gift))}
                      showCopy={false}
                      buttonLabel={t("payments.share")}
                      align="right"
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
