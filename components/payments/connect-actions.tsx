"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
import { useState } from "react";

import {
  CountrySelect,
  type CountryOption,
} from "@/components/payments/country-select";

type Busy = "none" | "onboarding" | "dashboard";

const buttonClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-70";

/**
 * Buttons that ask the server for single-use Stripe URLs (onboarding link /
 * dashboard login link) and follow them. No Stripe ids in the browser.
 *
 * Before an account exists, a country picker is shown: the connected account's
 * country is fixed at creation by Stripe and can't be changed later, so the
 * creator chooses it here (it also determines their payout currency).
 */
export function ConnectActions({
  onboardingLabel,
  showDashboardLink,
  countryOptions,
}: {
  /** null hides the onboarding button (account fully ready). */
  onboardingLabel: string | null;
  showDashboardLink: boolean;
  /** Country choices shown only before the account is created; omit after. */
  countryOptions?: CountryOption[];
}) {
  const [busy, setBusy] = useState<Busy>("none");
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState(countryOptions?.[0]?.code ?? "GB");

  const showCountry = Boolean(
    onboardingLabel && countryOptions && countryOptions.length > 0,
  );

  async function follow(endpoint: string, kind: Busy, body?: unknown) {
    setBusy(kind);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (response.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy("none");
  }

  return (
    <div className="space-y-4">
      {showCountry ? (
        <div>
          <label
            htmlFor="connect-country"
            className="block text-sm font-medium text-ink/80"
          >
            Your country
          </label>
          <CountrySelect
            id="connect-country"
            label="Your country"
            value={country}
            onChange={setCountry}
            options={countryOptions!}
          />
          <p className="mt-1.5 text-xs text-ink/60">
            Set once and can&apos;t be changed later — it fixes your payout
            currency.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {onboardingLabel ? (
          <button
            type="button"
            disabled={busy !== "none"}
            onClick={() =>
              follow(
                "/api/connect/onboarding-link",
                "onboarding",
                showCountry ? { country } : undefined,
              )
            }
            className={`${buttonClasses} bg-forest text-white hover:bg-forest-dark`}
          >
            {busy === "onboarding" ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            {onboardingLabel}
          </button>
        ) : null}
        {showDashboardLink ? (
          <button
            type="button"
            disabled={busy !== "none"}
            onClick={() => follow("/api/connect/dashboard-link", "dashboard")}
            className={`${buttonClasses} border border-forest/30 text-forest hover:border-forest hover:bg-forest/5`}
          >
            {busy === "dashboard" ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            )}
            Payouts &amp; details on Stripe
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
