import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";
import { getCustomerOrderStatus } from "@/lib/merch/orders";

/**
 * Merch order confirmation page (ADR-024, spec §29). Shown after the customer
 * returns from Stripe-hosted Checkout. Deliberately minimal — order details are
 * emailed; this only confirms receipt and shows the order reference. The order
 * is marked paid by the verified webhook, not by this redirect.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "shop" });
  return { title: t("thanks.title"), robots: { index: false, follow: false } };
}

export default async function MerchThanksPage({
  params,
}: {
  params: Promise<{ locale: string; reference: string }>;
}) {
  const { locale, reference } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "shop" });

  // Live status by the unguessable reference (spec §29) — only if it exists.
  const order = await getCustomerOrderStatus(reference).catch(() => null);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-serif text-3xl text-ink">{t("thanks.title")}</h1>
      <p className="mt-4 text-ink/70">{t("thanks.body")}</p>
      <p className="mt-6 text-sm text-ink/70">
        {t("thanks.referenceLabel")}:{" "}
        <span className="font-mono text-ink">{reference}</span>
      </p>
      {order ? (
        <div className="mt-4 text-sm text-ink/70">
          <p>
            {t("thanks.statusLabel")}: <span className="text-ink">{order.status}</span>
          </p>
          {order.shipments.map((s, i) =>
            s.trackingUrl ? (
              <a key={i} href={s.trackingUrl} className="mt-1 inline-block text-forest hover:underline" target="_blank" rel="noreferrer">
                {t("thanks.trackingLabel")}{s.trackingNumber ? ` · ${s.trackingNumber}` : ""}
              </a>
            ) : null,
          )}
        </div>
      ) : null}
      <Link
        href="/discover"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-forest px-6 text-sm font-medium text-white"
      >
        {t("thanks.backToShop")}
      </Link>
    </main>
  );
}
