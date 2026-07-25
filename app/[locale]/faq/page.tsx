import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CallToAction } from "@/components/call-to-action";
import { FaqAccordion } from "@/components/faq-accordion";
import { PageHeader } from "@/components/page-header";
import { StructuredData } from "@/components/structured-data";
import type { AppLocale } from "@/i18n/locales";
import { allFaqs, faqGroups, type FaqItem } from "@/lib/content/faqs";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqJsonLd } from "@/lib/seo/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "faq",
  });
  return pageMetadata({
    title: t("meta.title"),
    description: t("meta.description"),
    path: "/faq",
    locale: locale as AppLocale,
  });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "faq",
  });

  const translate = (item: FaqItem) => ({
    question: t(item.questionKey as never),
    answer: t(item.answerKey as never),
  });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t("page.breadcrumb"), href: "/faq" }]}
        eyebrow={t("page.eyebrow")}
        heading={t("page.heading")}
        intro={t("page.intro")}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          {faqGroups.map((group) => (
            <div key={group.id}>
              <h2 className="font-serif text-2xl font-semibold text-forest">
                {t(group.headingKey as never)}
              </h2>
              <div className="mt-5">
                <FaqAccordion faqs={group.faqs.map(translate)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ structured data matches the visible questions above (and only
          those), in the same language as the page. */}
      <StructuredData
        data={faqJsonLd(allFaqs.map(translate), locale as AppLocale)}
      />

      <CallToAction heading={t("cta.heading")} body={t("cta.body")} />
    </>
  );
}
