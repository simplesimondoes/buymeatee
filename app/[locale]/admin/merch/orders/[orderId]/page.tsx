import { getTranslations, setRequestLocale } from "next-intl/server";

import { MerchOrderActions } from "@/components/merch/merch-order-actions";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";
import { redirect } from "@/i18n/navigation";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { formatMinorAmount } from "@/lib/i18n/format";
import { getOrderDetail } from "@/lib/merch/orders";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale as AppLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({ href: "/sign-in?next=/admin/merch", locale: locale as AppLocale });
    return null;
  }
  if (!canViewAnalytics(user.email)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const detail = await getOrderDetail(orderId);
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "admin" });
  if (!detail) {
    const { notFound } = await import("next/navigation");
    notFound();
    return null;
  }
  const cur = detail.summary.currency as SupportedCurrency;
  const money = (m: number) => formatMinorAmount(m, cur, locale as AppLocale);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin/merch" className="text-sm text-forest hover:underline">
        ← {t("merchCatalogue.orders.back")}
      </Link>
      <h1 className="mt-3 font-serif text-2xl text-ink">
        {t("merchCatalogue.orders.detailTitle")}{" "}
        <span className="font-mono text-lg text-ink/70">{detail.summary.publicReference}</span>
      </h1>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-3xl border border-stone bg-white p-5 text-sm">
        <Row label={t("merchCatalogue.orders.status")} value={`${detail.summary.status} / ${detail.summary.paymentStatus} / ${detail.summary.fulfilmentStatus}`} />
        <Row label={t("merchCatalogue.orders.total")} value={money(detail.summary.customerTotalMinor)} />
        <Row label={t("merchCatalogue.orders.creatorProfit")} value={money(detail.summary.creatorProfitMinor)} />
        <Row label={t("merchCatalogue.orders.printfulOrder")} value={detail.printfulOrderId ?? "—"} />
      </dl>

      {detail.summary.reconciliationError ? (
        <p className="mt-3 rounded-2xl bg-gold/15 p-3 text-sm text-gold-deep">
          ⚠️ {detail.summary.reconciliationError}
        </p>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/70">{t("merchCatalogue.orders.items")}</h2>
        <ul className="rounded-2xl border border-stone bg-white p-4 text-sm">
          {detail.items.map((i, idx) => (
            <li key={idx} className="flex justify-between py-1">
              <span className="text-ink">{i.title} · {i.colour} / {i.size} × {i.quantity}</span>
              <span className="text-ink/70">{money(i.unitPriceMinor)}</span>
            </li>
          ))}
        </ul>
      </section>

      {detail.shipments.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/70">{t("merchCatalogue.orders.shipments")}</h2>
          <ul className="rounded-2xl border border-stone bg-white p-4 text-sm">
            {detail.shipments.map((sh, idx) => (
              <li key={idx} className="py-1 text-ink/70">
                {sh.carrier ?? "—"} · {sh.trackingNumber ?? "—"}
                {sh.trackingUrl ? <> · <a href={sh.trackingUrl} className="text-forest hover:underline" target="_blank" rel="noreferrer">{t("merchCatalogue.orders.tracking")}</a></> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/70">{t("merchCatalogue.orders.timeline")}</h2>
        <ol className="space-y-1 rounded-2xl border border-stone bg-white p-4 text-sm">
          {detail.events.length === 0 ? (
            <li className="text-ink/70">—</li>
          ) : (
            detail.events.map((e, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="shrink-0 text-ink/40">{e.source}</span>
                <span className="text-ink">{e.eventType}{e.message ? ` — ${e.message}` : ""}</span>
              </li>
            ))
          )}
        </ol>
      </section>

      <MerchOrderActions orderId={detail.summary.id} />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink/70">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
