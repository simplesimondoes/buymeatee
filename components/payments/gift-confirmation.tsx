"use client";

import { CircleAlert, CircleCheck, Clock, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";

export interface GiftConfirmationStatus {
  phase: "confirming" | "paid" | "pending" | "failed" | "expired" | "cancelled";
  recipientName: string;
  recipientUsername: string | null;
  giftAmount: number;
  currency: SupportedCurrency;
  message: string | null;
  senderName: string;
  isAnonymous: boolean;
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
              Confirming your payment…
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
              We&apos;re waiting for Stripe to confirm. This usually takes a
              few seconds.
            </p>
          </>
        ) : (
          <>
            <Clock aria-hidden="true" className="mx-auto h-10 w-10 text-ink/60" />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
              Still confirming
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
              Confirmation is taking longer than usual. If you completed
              payment, it will be recorded — you can check again in a moment.
            </p>
            <button
              type="button"
              onClick={() => setPolls(0)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-forest/30 px-6 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
            >
              Check again
            </button>
          </>
        )}
      </div>
    );
  }

  if (status.phase === "paid") {
    return (
      <div className="rounded-3xl border border-forest/25 bg-forest/5 p-8 text-center">
        <CircleCheck aria-hidden="true" className="mx-auto h-10 w-10 text-forest" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
          Your Tee is on its way to {status.recipientName}.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          {formatMinorAmount(status.giftAmount, status.currency)} from{" "}
          {status.isAnonymous ? "Anonymous" : status.senderName} was paid
          successfully.
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
              ? `Back to ${status.recipientName}'s page`
              : "Back to BuyMeATee"}
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
          Payment pending
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          Your payment is being processed. We&apos;ll record the Tee as soon as
          it completes.
        </p>
      </div>
    );
  }

  const failedCopy =
    status.phase === "expired"
      ? {
          heading: "This checkout expired",
          body: "No payment was taken. You can send the Tee again whenever you like.",
        }
      : status.phase === "cancelled"
        ? {
            heading: "Checkout cancelled",
            body: "No payment was taken.",
          }
        : {
            heading: "Payment unsuccessful",
            body: "Your payment didn't go through and nothing was charged. You can try again with a different card.",
          };

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
            Try again
          </Link>
        </div>
      ) : null}
    </div>
  );
}
