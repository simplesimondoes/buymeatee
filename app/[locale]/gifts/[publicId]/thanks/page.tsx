import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@/components/intl/client-messages";
import {
  GiftConfirmation,
  type GiftConfirmationStatus,
} from "@/components/payments/gift-confirmation";
import { getGiftPublicStatus } from "@/lib/payments/gifts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "gifts",
  });
  return {
    title: t("confirmation.thanksMetaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Checkout success page. Shows the verified state only — a redirect here
 * proves nothing, so the page reads (and then polls) the safe status that the
 * webhook maintains. It never writes payment state.
 */
export default async function GiftThanksPage({
  params,
}: {
  params: Promise<{ locale: string; publicId: string }>;
}) {
  const { locale, publicId } = await params;
  setRequestLocale(locale as AppLocale);

  const status = await getGiftPublicStatus(publicId).catch(() => null);
  if (!status) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <ClientMessages namespaces={["gifts", "errors"]}>
        <GiftConfirmation
          publicId={publicId}
          initial={status as GiftConfirmationStatus}
        />
      </ClientMessages>
    </main>
  );
}
