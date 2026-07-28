import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { AppLocale } from "@/i18n/locales";
import { LegalPage } from "@/lib/content/legal/legal-page";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "legal",
  });
  return pageMetadata({
    title: t("meta.privacy.title"),
    description: t("meta.privacy.description"),
    path: "/privacy",
    locale: locale as AppLocale,
    noindex: true,
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  return <LegalPage kind="privacy" locale={locale as AppLocale} />;
}
