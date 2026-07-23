import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  GiftConfirmation,
  type GiftConfirmationStatus,
} from "@/components/payments/gift-confirmation";
import { getGiftPublicStatus } from "@/lib/payments/gifts";

export const metadata: Metadata = {
  title: "Thanks for the Tee",
  robots: { index: false, follow: false },
};

/**
 * Checkout success page. Shows the verified state only — a redirect here
 * proves nothing, so the page reads (and then polls) the safe status that the
 * webhook maintains. It never writes payment state.
 */
export default async function GiftThanksPage({
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
      <GiftConfirmation
        publicId={publicId}
        initial={status as GiftConfirmationStatus}
      />
    </main>
  );
}
