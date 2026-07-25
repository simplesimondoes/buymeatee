import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BlogCard } from "@/components/blog-card";
import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
import type { AppLocale } from "@/i18n/locales";
import { getArticles } from "@/lib/content/article-registry";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "blog",
  });
  return pageMetadata({
    title: t("meta.index.title"),
    description: t("meta.index.description"),
    path: "/blog",
    locale: locale as AppLocale,
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "blog",
  });
  const articles = getArticles(locale as AppLocale);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t("index.breadcrumb"), href: "/blog" }]}
        eyebrow={t("index.eyebrow")}
        heading={t("index.heading")}
        intro={t("index.intro")}
      />
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>
      <CallToAction />
    </>
  );
}
