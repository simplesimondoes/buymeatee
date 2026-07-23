import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGiftPublicStatus } from "@/lib/payments/gifts";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

/**
 * Checkout cancel page. Deliberately performs no writes: the pending gift
 * stays `checkout_created` until Stripe's checkout.session.expired webhook
 * marks it `expired` (documented rule — retrying simply creates a new gift,
 * so duplicate *paid* gifts are impossible).
 */
export default async function GiftCancelledPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const status = await getGiftPublicStatus(publicId).catch(() => null);
  if (!status) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-3xl border border-stone bg-white p-8 text-center">
        <CircleAlert aria-hidden="true" className="mx-auto h-10 w-10 text-ink/50" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-forest">
          Checkout cancelled
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          No payment was taken. {status.recipientName} didn&apos;t receive
          anything — you can send a Tee any time.
        </p>
        {status.recipientUsername ? (
          <div className="mt-6">
            <Link
              href={`/t/${status.recipientUsername}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
            >
              Back to {status.recipientName}&apos;s page
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
