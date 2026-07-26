import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@/components/intl/client-messages";
import { ProductWizard } from "@/components/merch/product-wizard";
import type { AppLocale } from "@/i18n/locales";
import { redirect } from "@/i18n/navigation";
import { getMerchFlags, getMerchPricingConfig } from "@/lib/merch/config";
import {
  getCuratedProductsForWizard,
  type WizardCuratedProduct,
} from "@/lib/merch/wizard-data";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "shop" });
  return { title: t("wizard.title"), robots: { index: false, follow: false } };
}

export default async function NewMerchProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent("/dashboard/merch/new")}`,
      locale: locale as AppLocale,
    });
    return null;
  }
  // Behind the merch feature flag, like the rest of the creator merch area.
  if (!getMerchFlags().merchEnabled) {
    redirect({ href: "/dashboard/merch", locale: locale as AppLocale });
    return null;
  }

  let products: WizardCuratedProduct[] = [];
  try {
    products = await getCuratedProductsForWizard();
  } catch {
    products = [];
  }

  return (
    <ClientMessages namespaces={["shop", "dashboard", "errors"]}>
      <ProductWizard products={products} pricingConfig={getMerchPricingConfig()} />
    </ClientMessages>
  );
}
