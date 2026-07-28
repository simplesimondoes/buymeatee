import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { ClientMessages } from "@/components/intl/client-messages";
import { ProductPurchase } from "@/components/merch/product-purchase";
import type { AppLocale } from "@/i18n/locales";
import { getMerchFlags } from "@/lib/merch/config";
import { getPublishedProductBySlug, type MerchProductRow } from "@/lib/merch/products";
import { canonicalUrl } from "@/lib/seo/metadata";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface CreatorRow {
  id: string;
  username: string;
  display_name: string | null;
}

const loadCreator = cache(async (username: string): Promise<CreatorRow | null> => {
  if (!/^[a-z0-9_-]{3,40}$/i.test(username)) return null;
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return (data as CreatorRow | null) ?? null;
});

const loadProduct = cache(
  async (creatorId: string, slug: string): Promise<MerchProductRow | null> => {
    try {
      return await getPublishedProductBySlug(creatorId, slug);
    } catch {
      return null;
    }
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string; productSlug: string }>;
}): Promise<Metadata> {
  const { locale, username, productSlug } = await params;
  const creator = await loadCreator(username);
  const product = creator ? await loadProduct(creator.id, productSlug) : null;
  if (!creator || !product) {
    return { title: "Shop", robots: { index: false, follow: false } };
  }
  const name = creator.display_name || creator.username;
  return {
    title: `${product.title} — ${name}`,
    description: product.description ?? undefined,
    alternates: {
      canonical: canonicalUrl(
        `/t/${creator.username}/shop/${product.slug}`,
        locale as AppLocale,
      ),
    },
    openGraph: {
      title: `${product.title} — ${name}`,
      images: product.placement_configuration?.previewUrl
        ? [product.placement_configuration.previewUrl]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; username: string; productSlug: string }>;
}) {
  const { locale, username, productSlug } = await params;
  setRequestLocale(locale as AppLocale);

  if (!getMerchFlags().merchEnabled) {
    notFound();
  }
  const creator = await loadCreator(username);
  if (!creator) notFound();
  const product = await loadProduct(creator.id, productSlug);
  if (!product) notFound();

  const t = await getTranslations({ locale: locale as AppLocale, namespace: "shop" });

  return (
    <ClientMessages namespaces={["shop", "errors"]}>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-stone bg-mist">
            <div className="flex aspect-square items-center justify-center">
              {product.placement_configuration?.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.placement_configuration.previewUrl}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-ink/40">{product.title}</span>
              )}
            </div>
          </div>
          <div>
            <h1 className="font-serif text-3xl text-ink">{product.title}</h1>
            {product.description ? (
              <p className="mt-3 text-ink/70">{product.description}</p>
            ) : null}
            <p className="mt-4 text-sm text-ink/70">{t("shop.fulfilmentNotice")}</p>
            <ProductPurchase
              creatorId={creator.id}
              productId={product.id}
              currency={product.currency}
              retailPriceMinor={product.retail_price_minor}
              colours={product.selected_colours ?? []}
              sizes={product.selected_sizes ?? []}
              cancelPath={`/${locale}/t/${creator.username}/shop/${product.slug}`}
            />
            <p className="mt-6 text-xs text-ink/70">{t("delivery.estimateNotice")}</p>
          </div>
        </div>
      </main>
    </ClientMessages>
  );
}
