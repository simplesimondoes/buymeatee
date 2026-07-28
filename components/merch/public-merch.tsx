import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { MerchProductRow } from "@/lib/merch/products";

/**
 * Public merchandise grid on a creator's profile (ADR-024, spec §13). Shows the
 * creator's published products, the production-on-demand explanation and the
 * fulfilment/delivery notices. Server component — display only; the buy flow is
 * a follow-up. Renders nothing when there are no published products, so the
 * Shop section only appears once a creator has real merch.
 */
export async function PublicMerch({
  products,
  locale,
  username,
}: {
  products: MerchProductRow[];
  locale: AppLocale;
  username: string;
}) {
  if (products.length === 0) {
    return null;
  }
  const t = await getTranslations({ locale, namespace: "shop" });

  return (
    <section id="shop" className="scroll-mt-20" aria-label={t("shop.heading")}>
      <h2 className="font-serif text-xl font-semibold text-forest">
        {t("shop.heading")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        {t("shop.fulfilmentNotice")}
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <li
            key={product.id}
            className="overflow-hidden rounded-3xl border border-stone bg-white transition-colors hover:border-forest"
          >
            <Link href={`/t/${username}/shop/${product.slug}`} className="block">
              <div className="flex aspect-square items-center justify-center bg-mist text-ink/30">
                {product.placement_configuration?.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.placement_configuration.previewUrl}
                    alt={product.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm">{product.title}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <h3 className="text-sm font-medium text-ink">{product.title}</h3>
                <span className="shrink-0 text-sm font-semibold text-forest">
                  {formatMinorAmount(product.retail_price_minor, product.currency, locale)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-ink/70">
        {t("delivery.estimateNotice")}
      </p>
    </section>
  );
}
