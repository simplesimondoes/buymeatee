import type { AppLocale } from "@/i18n/locales";
import { CircleCheck, CircleAlert, Clock, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { ConnectActions } from "@/components/payments/connect-actions";
import { getAllowedConnectCountries } from "@/lib/payments/config";
import {
  CONNECT_COUNTRIES,
  countryFlagEmoji,
  countryName,
} from "@/lib/payments/countries";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "settings",
  });
  return {
    title: t("meta.payments.title"),
    description: t("meta.payments.description"),
    robots: { index: false, follow: false },
  };
}

const SYNC_STALENESS_MS = 5 * 60 * 1000;

type StateCopy = {
  heading: string;
  body: string;
  tone: "neutral" | "good" | "attention" | "pending";
  onboardingLabel: string | null;
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
      return <Clock aria-hidden="true" className={`${classes} text-ink/70`} />;
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

export default async function PaymentSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "settings",
  });

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/settings/payments`)}`,
      locale: locale as AppLocale,
    });
  }

  // Static keys per state keep the translation calls type-checked against
  // the English catalog.
  const stateCopy: Record<PaymentSetupState, StateCopy> = {
    not_started: {
      heading: t("payments.state.notStarted.heading"),
      body: t("payments.state.notStarted.body"),
      tone: "neutral",
      onboardingLabel: t("payments.state.notStarted.cta"),
    },
    onboarding_not_started: {
      heading: t("payments.state.onboardingNotStarted.heading"),
      body: t("payments.state.onboardingNotStarted.body"),
      tone: "neutral",
      onboardingLabel: t("payments.state.onboardingNotStarted.cta"),
    },
    onboarding_incomplete: {
      heading: t("payments.state.onboardingIncomplete.heading"),
      body: t("payments.state.onboardingIncomplete.body"),
      tone: "attention",
      onboardingLabel: t("payments.state.onboardingIncomplete.cta"),
    },
    information_required: {
      heading: t("payments.state.informationRequired.heading"),
      body: t("payments.state.informationRequired.body"),
      tone: "attention",
      onboardingLabel: t("payments.state.informationRequired.cta"),
    },
    verification_pending: {
      heading: t("payments.state.verificationPending.heading"),
      body: t("payments.state.verificationPending.body"),
      tone: "pending",
      onboardingLabel: null,
    },
    ready: {
      heading: t("payments.state.ready.heading"),
      body: t("payments.state.ready.body"),
      tone: "good",
      onboardingLabel: null,
    },
    payments_restricted: {
      heading: t("payments.state.paymentsRestricted.heading"),
      body: t("payments.state.paymentsRestricted.body"),
      tone: "attention",
      onboardingLabel: t("payments.state.paymentsRestricted.cta"),
    },
    payouts_disabled: {
      heading: t("payments.state.payoutsDisabled.heading"),
      body: t("payments.state.payoutsDisabled.body"),
      tone: "attention",
      onboardingLabel: t("payments.state.payoutsDisabled.cta"),
    },
  };

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

  // The country is chosen only before the account exists (Stripe fixes it at
  // creation). Once an account exists, no picker — the country is set. Build
  // the picker from our country table, gated by the allowed-country list.
  // Country names are currently English-only (lib/payments/countries.ts) —
  // localising them is a known follow-up.
  const allowed = new Set(getAllowedConnectCountries());
  const countryOptions = account
    ? undefined
    : CONNECT_COUNTRIES.filter((country) => allowed.has(country.code)).map(
        (country) => ({
          code: country.code,
          label: country.name,
          flag: countryFlagEmoji(country.code),
        }),
      );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("payments.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {t("payments.intro")}
      </p>

      {unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          {t("payments.unavailable")}
        </div>
      ) : (
        <section
          aria-label={t("payments.statusAria")}
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
                    <dt className="font-medium text-ink/80">
                      {t("payments.countryTerm")}
                    </dt>
                    <dd>
                      <span aria-hidden="true">
                        {countryFlagEmoji(account.country)}
                      </span>{" "}
                      {countryName(account.country)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-ink/80">
                      {t("payments.receivingTerm")}
                    </dt>
                    <dd>
                      {ready
                        ? t("payments.receivingYes")
                        : t("payments.receivingNo")}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
          <div className="mt-6">
            <ConnectActions
              onboardingLabel={copy.onboardingLabel}
              showDashboardLink={Boolean(account?.details_submitted)}
              countryOptions={countryOptions}
            />
          </div>
        </section>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink/70">
        {t("payments.footnote")}
      </p>
    </main>
  );
}
