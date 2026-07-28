import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CookieConsent } from "@/components/cookie-consent";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StructuredData } from "@/components/structured-data";
import { routing } from "@/i18n/routing";
import { htmlLang, locales, type AppLocale } from "@/i18n/locales";
import { loadMessages } from "@/i18n/load-messages";
import { fontClasses } from "@/lib/fonts";
import { rootMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/structured-data";

import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "meta" });
  return rootMetadata(locale as AppLocale, {
    title: t("root.defaultTitle"),
    description: t("root.description"),
  });
}

/**
 * Namespaces serialized into the client for every page. Keep this list to
 * what client components genuinely need everywhere (nav, shared errors);
 * feature areas provide their own namespaces closer to where they render,
 * so marketing pages don't ship the whole catalog.
 */
const GLOBAL_CLIENT_NAMESPACES = ["common"] as const;

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale as AppLocale);

  const messages = await loadMessages(locale as AppLocale);
  const clientMessages = Object.fromEntries(
    GLOBAL_CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]),
  );
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "common" });

  return (
    <html
      lang={htmlLang[locale as AppLocale]}
      className={fontClasses(locale as AppLocale)}
    >
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-5 focus:py-2.5 focus:text-white"
          >
            {t("a11y.skipToContent")}
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </NextIntlClientProvider>
        <StructuredData
          data={[
            webSiteJsonLd(locale as AppLocale),
            organizationJsonLd(locale as AppLocale),
          ]}
        />
      </body>
    </html>
  );
}
