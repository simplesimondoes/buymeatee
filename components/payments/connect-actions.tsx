"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
import { useState } from "react";

type Busy = "none" | "onboarding" | "dashboard";

const buttonClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-70";

/**
 * Buttons that ask the server for single-use Stripe URLs (onboarding link /
 * dashboard login link) and follow them. No Stripe ids in the browser.
 */
export function ConnectActions({
  onboardingLabel,
  showDashboardLink,
}: {
  /** null hides the onboarding button (account fully ready). */
  onboardingLabel: string | null;
  showDashboardLink: boolean;
}) {
  const [busy, setBusy] = useState<Busy>("none");
  const [error, setError] = useState<string | null>(null);

  async function follow(endpoint: string, kind: Busy) {
    setBusy(kind);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const body = (await response.json()) as { url?: string; error?: string };
      if (response.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy("none");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {onboardingLabel ? (
          <button
            type="button"
            disabled={busy !== "none"}
            onClick={() => follow("/api/connect/onboarding-link", "onboarding")}
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
