"use client";

import { CircleAlert, CircleCheck, Clock, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";

import type { AppLocale } from "@/i18n/locales";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { SupportedCurrency } from "@/lib/payments/currency";

export interface GiftConfirmationStatus {
  phase: "confirming" | "paid" | "pending" | "failed" | "expired" | "cancelled";
  recipientName: string;
  recipientUsername: string | null;
  giftAmount: number;
  currency: SupportedCurrency;
  message: string | null;
  senderName: string;
  isAnonymous: boolean;
  /** What the Tee was put toward — null means general support. */
  target: { kind: "goal" | "wishlist"; title: string } | null;
}

const POLL_INTERVAL_MS = 3_000;
const POLL_LIMIT = 20; // ~60s — webhooks normally land within seconds.

/**
 * Success-page status display. Polls the safe status endpoint while the
 * verified webhook confirms payment — the page itself never marks anything
 * paid. After the bounded poll window it offers a manual refresh.
 */
export function GiftConfirmation({
  publicId,
  initial,
}: {
  publicId: string;
  initial: GiftConfirmationStatus;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("gifts.confirmation");
  const tGifts = useTranslations("gifts");
  const [status, setStatus] = useState(initial);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (status.phase !== "confirming" || polls >= POLL_LIMIT) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/gifts/${publicId}/status`, {
          cache: "no-store",
        });
        if (response.ok) {
          setStatus((await response.json()) as GiftConfirmationStatus);
        }
      } catch {
        // Transient network issue — the next poll retries.
      }
      setPolls((count) => count + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [status.phase, polls, publicId]);

  if (status.phase === "confirming") {
    return (
      <div role="status" className="rounded-3xl border border-stone bg-white p-8 text-center">
        {polls < POLL_LIMIT ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto h-10 w-10 animate-spin text-forest"
            />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
              {t("confirmingHeading")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
              {t("confirmingBody")}
            </p>
          </>
        ) : (
          <>
            <Clock aria-hidden="true" className="mx-auto h-10 w-10 text-ink/60" />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
              {t("stillConfirmingHeading")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
              {t("stillConfirmingBody")}
            </p>
            <button
              type="button"
              onClick={() => setPolls(0)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-forest/30 px-6 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
            >
              {t("checkAgain")}
            </button>
          </>
        )}
      </div>
    );
  }

  if (status.phase === "paid") {
    const amount = formatMinorAmount(status.giftAmount, status.currency, locale);
    const sender = status.isAnonymous ? tGifts("anonymous") : status.senderName;
    return (
      <div className="rounded-3xl border border-forest/25 bg-forest/5 p-8 text-center">
        <CircleCheck aria-hidden="true" className="mx-auto h-10 w-10 text-forest" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
          {t("paidHeading", { name: status.recipientName })}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          {status.target
            ? t.rich("paidBodyToward", {
                amount,
                sender,
                title: status.target.title,
                target: (chunks) => (
                  <span className="font-medium text-forest">{chunks}</span>
                ),
              })
            : t("paidBody", { amount, sender })}
        </p>
        {status.message ? (
          <blockquote className="mx-auto mt-4 max-w-md rounded-2xl bg-white p-4 text-sm italic leading-relaxed text-ink/80">
            “{status.message}”
          </blockquote>
        ) : null}
        <div className="mt-6">
          <Link
            href={status.recipientUsername ? `/t/${status.recipientUsername}` : "/"}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            {status.recipientUsername
              ? t("backToPage", { name: status.recipientName })
              : t("backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (status.phase === "pending") {
    return (
      <div role="status" className="rounded-3xl border border-stone bg-mist p-8 text-center">
        <Clock aria-hidden="true" className="mx-auto h-10 w-10 text-ink/60" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
          {t("pendingHeading")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          {t("pendingBody")}
        </p>
      </div>
    );
  }

  const failedCopy =
    status.phase === "expired"
      ? { heading: t("expiredHeading"), body: t("expiredBody") }
      : status.phase === "cancelled"
        ? { heading: t("cancelledHeading"), body: t("cancelledBody") }
        : { heading: t("failedHeading"), body: t("failedBody") };

  return (
    <div className="rounded-3xl border border-stone bg-white p-8 text-center">
      <CircleAlert aria-hidden="true" className="mx-auto h-10 w-10 text-amber-700" />
      <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
        {failedCopy.heading}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
        {failedCopy.body}
      </p>
      {status.recipientUsername ? (
        <div className="mt-6">
          <Link
            href={`/t/${status.recipientUsername}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            {t("tryAgain")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
