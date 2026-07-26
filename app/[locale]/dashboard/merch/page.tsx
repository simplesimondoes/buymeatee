import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@/components/intl/client-messages";
import { MerchManager } from "@/components/merch/merch-manager";
import type { AppLocale } from "@/i18n/locales";
import { redirect } from "@/i18n/navigation";
import { getMerchFlags } from "@/lib/merch/config";
import { getOwnProducts, type MerchProductRow } from "@/lib/merch/products";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "shop" });
  return {
    title: t("dashboard.title"),
    robots: { index: false, follow: false },
  };
}

export default async function MerchDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent("/dashboard/merch")}`,
      locale: locale as AppLocale,
    });
    return null;
  }

  const merchEnabled = getMerchFlags().merchEnabled;

  let products: MerchProductRow[] = [];
  let unavailable = false;
  if (merchEnabled) {
    try {
      products = await getOwnProducts(user.id);
    } catch {
      unavailable = true;
    }
  }

  return (
    <ClientMessages namespaces={["shop", "dashboard", "errors"]}>
      <MerchManager
        products={products}
        merchEnabled={merchEnabled}
        unavailable={unavailable}
      />
    </ClientMessages>
  );
}
