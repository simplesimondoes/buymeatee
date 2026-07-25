"use client";

import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Link } from "@/i18n/navigation";

import {
  COOKIE_CONSENT_CHANGED_EVENT as CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY as STORAGE_KEY,
  COOKIE_SETTINGS_EVENT as OPEN_EVENT,
} from "@/lib/cookie-consent";

/**
 * Consent-gated analytics (GDPR + TDDDG §25). Google Analytics is a non-
 * essential analytics cookie, so it must NOT load until the visitor opts in.
 *
 * This component owns the consent choice and only injects GA once consent is
 * "granted". A first-time visitor sees a banner with equally-weighted Accept
 * and Decline; the choice is stored and can be reopened from the footer's
 * "Cookie settings" control (a `bmat:cookie-settings` window event). Essential
 * cookies (the sign-in session) never depend on this and are covered in the
 * Privacy Policy.
 */

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-9CMNRQ8W52";

type Consent = "granted" | "denied" | null;

// The stored choice is external state (localStorage), read via
// useSyncExternalStore so it stays SSR-safe and updates across tabs.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGED_EVENT, callback);
  };
}

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

// Server (and first hydration) render nothing — no banner flash, no early GA.
function serverConsent(): Consent {
  return null;
}

export function CookieConsent() {
  const t = useTranslations("common");
  const locale = useLocale();
  const stored = useSyncExternalStore(subscribe, readConsent, serverConsent);
  // Transient: lets the footer re-open the banner without erasing the choice.
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    function onOpen() {
      setReopened(true);
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const choose = useCallback((value: "granted" | "denied") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Non-fatal: the choice just won't persist across visits.
    }
    setReopened(false);
    // Withdrawing consent after GA has already loaded this session: reload so
    // the tag stops running (it won't be re-injected while consent is denied).
    if (value === "denied" && typeof window !== "undefined" && "gtag" in window) {
      window.location.reload();
      return;
    }
    window.dispatchEvent(new Event(CHANGED_EVENT));
  }, []);

  const loadAnalytics = Boolean(GA_MEASUREMENT_ID) && stored === "granted";
  const showBanner = stored === null || reopened;

  return (
    <>
      {loadAnalytics ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { locale: '${locale}' });
            `}
          </Script>
        </>
      ) : null}

      {showBanner ? (
        <div
          role="region"
          aria-label={t("cookies.regionLabel")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-stone bg-white/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8">
            <p className="text-sm leading-relaxed text-ink/80">
              {t.rich("cookies.message", {
                link: (chunks) => (
                  <Link
                    href="/privacy"
                    className="font-medium text-gold-deep underline hover:text-forest"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => choose("denied")}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-stone px-5 text-sm font-medium text-forest transition-colors hover:bg-mist lg:flex-none"
              >
                {t("cookies.decline")}
              </button>
              <button
                type="button"
                onClick={() => choose("granted")}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark lg:flex-none"
              >
                {t("cookies.accept")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
