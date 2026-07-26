import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminCatalogueManager } from "@/components/merch/admin-catalogue-manager";
import { MerchReconcileButton } from "@/components/merch/merch-reconcile-button";
import { Link } from "@/i18n/navigation";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import {
  getMerchAnalyticsSnapshot,
  type MerchAnalyticsSnapshot,
} from "@/lib/merch/analytics";
import type { AppLocale } from "@/i18n/locales";
import { redirect } from "@/i18n/navigation";
import { formatMinorAmount } from "@/lib/i18n/format";
import {
  listAllCuratedProductsForAdmin,
  type AdminCuratedRow,
} from "@/lib/merch/admin-catalogue";
import { listPendingProducts, type PendingProduct } from "@/lib/merch/moderation";
import { listOrdersForAdmin, type AdminOrderSummary } from "@/lib/merch/orders";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { isPrintfulConfigured } from "@/lib/printful/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "admin" });
  return { title: t("merchCatalogue.title"), robots: { index: false, follow: false } };
}

export default async function AdminMerchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent("/admin/merch")}`,
      locale: locale as AppLocale,
    });
    return null;
  }
  // Owner-only, like analytics/social — everyone else gets a plain 404.
  if (!canViewAnalytics(user.email)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const t = await getTranslations({ locale: locale as AppLocale, namespace: "admin" });
  let curated: AdminCuratedRow[] = [];
  let pending: PendingProduct[] = [];
  let orders: AdminOrderSummary[] = [];
  let analytics: MerchAnalyticsSnapshot | null = null;
  try {
    [curated, pending, orders, analytics] = await Promise.all([
      listAllCuratedProductsForAdmin(),
      listPendingProducts(),
      listOrdersForAdmin({ limit: 25 }),
      getMerchAnalyticsSnapshot(),
    ]);
  } catch {
    curated = [];
    pending = [];
    orders = [];
    analytics = null;
  }

  return (
    <>
      <AdminCatalogueManager
        curated={curated}
        pending={pending}
        printfulConfigured={isPrintfulConfigured()}
      />
      <section className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          {t("merchCatalogue.analytics.heading")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Tile label={t("merchCatalogue.analytics.totalOrders")} value={String(analytics?.totalOrders ?? 0)} />
          <Tile label={t("merchCatalogue.analytics.livePaid")} value={String(analytics?.livePaidOrders ?? 0)} />
          <Tile label={t("merchCatalogue.analytics.testMode")} value={String(analytics?.testModeOrders ?? 0)} />
        </div>
        {analytics && analytics.perCurrency.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-3xl border border-stone bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone text-left text-ink/50">
                <tr>
                  <th className="p-3 font-medium">{t("merchCatalogue.analytics.currency")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.analytics.gmv")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.analytics.printfulCost")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.analytics.platformFee")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.analytics.creatorEarnings")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.analytics.transferred")}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.perCurrency.map((c) => (
                  <tr key={c.currency} className="border-b border-stone/60 last:border-0">
                    <td className="p-3 uppercase text-ink">{c.currency}</td>
                    <td className="p-3 text-ink">{formatMinorAmount(c.grossMerchandiseValueMinor, c.currency as SupportedCurrency, locale as AppLocale)}</td>
                    <td className="p-3 text-ink/70">{formatMinorAmount(c.printfulCostMinor, c.currency as SupportedCurrency, locale as AppLocale)}</td>
                    <td className="p-3 text-forest">{formatMinorAmount(c.platformFeeMinor, c.currency as SupportedCurrency, locale as AppLocale)}</td>
                    <td className="p-3 text-ink/70">{formatMinorAmount(c.creatorEarningsMinor, c.currency as SupportedCurrency, locale as AppLocale)}</td>
                    <td className="p-3 text-ink/70">{formatMinorAmount(c.transferredMinor, c.currency as SupportedCurrency, locale as AppLocale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-ink/60">{t("merchCatalogue.analytics.none")}</p>
        )}
        <MerchReconcileButton />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          {t("merchCatalogue.orders.heading")}
        </h2>
        {orders.length === 0 ? (
          <p className="text-ink/60">{t("merchCatalogue.orders.none")}</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone text-left text-ink/50">
                <tr>
                  <th className="p-3 font-medium">{t("merchCatalogue.orders.reference")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.orders.status")}</th>
                  <th className="p-3 font-medium">{t("merchCatalogue.orders.total")}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-stone/60 last:border-0">
                    <td className="p-3 font-mono text-xs text-ink">{o.publicReference}</td>
                    <td className="p-3 text-ink/70">{o.status}{o.reconciliationError ? " ⚠️" : ""}</td>
                    <td className="p-3 text-ink">{formatMinorAmount(o.customerTotalMinor, o.currency as SupportedCurrency, locale as AppLocale)}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/merch/orders/${o.id}`} className="text-forest hover:underline">
                        {t("merchCatalogue.orders.view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone bg-white p-4">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
