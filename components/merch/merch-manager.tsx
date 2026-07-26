"use client";

import { useLocale, useTranslations } from "next-intl";

import type { MerchProductRow } from "@/lib/merch/products";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { AppLocale } from "@/i18n/locales";

/**
 * Creator merch dashboard (ADR-024, spec §12). Lists the creator's products
 * with their moderation status and the estimated profit. Fails gracefully:
 * honest states when merch is off, unavailable, or the creator has no products
 * yet. The full product builder is a follow-up; this is the overview it opens
 * from.
 */
export function MerchManager({
  products,
  merchEnabled,
  unavailable,
}: {
  products: MerchProductRow[];
  merchEnabled: boolean;
  unavailable: boolean;
}) {
  const t = useTranslations("shop");
  const locale = useLocale() as AppLocale;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-ink">{t("dashboard.title")}</h1>
        <p className="mt-2 max-w-2xl text-ink/70">{t("dashboard.subtitle")}</p>
      </header>

      {!merchEnabled ? (
        <Notice>{t("dashboard.notEnabled")}</Notice>
      ) : unavailable ? (
        <Notice>{t("dashboard.unavailable")}</Notice>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-stone bg-white p-8 text-center">
          <p className="text-ink/70">{t("dashboard.empty")}</p>
          <p className="mt-3 text-sm text-ink/50">{t("dashboard.builderComingSoon")}</p>
        </div>
      ) : (
        <section aria-label={t("dashboard.productsHeading")}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
            {t("dashboard.productsHeading")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="rounded-3xl border border-stone bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-ink">{product.title}</h3>
                  <StatusBadge status={product.status} label={t(`dashboard.status.${product.status}` as never)} />
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink/50">{t("dashboard.priceLabel")}</dt>
                    <dd className="text-ink">
                      {formatMinorAmount(product.retail_price_minor, product.currency, locale)}
                    </dd>
                  </div>
                  {product.estimated_creator_profit_minor !== null && (
                    <div className="flex justify-between">
                      <dt className="text-ink/50">{t("dashboard.profitLabel")}</dt>
                      <dd className="text-forest">
                        {formatMinorAmount(
                          product.estimated_creator_profit_minor,
                          product.currency,
                          locale,
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink/50">{t("dashboard.builderComingSoon")}</p>
        </section>
      )}
    </main>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-stone bg-mist p-6 text-ink/70">
      {children}
    </div>
  );
}

const PUBLISHED_STATUSES = new Set(["published", "approved"]);

function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = PUBLISHED_STATUSES.has(status)
    ? "bg-forest/10 text-forest"
    : status === "changes_requested" || status === "paused"
      ? "bg-gold/15 text-gold-deep"
      : "bg-stone/40 text-ink/60";
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
