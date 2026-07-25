import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ArticleBody } from "@/components/article-body";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallToAction } from "@/components/call-to-action";
import { StructuredData } from "@/components/structured-data";
import type { AppLocale } from "@/i18n/locales";
import { getArticle, articleSlugs } from "@/lib/content/article-registry";
import {
  articleAuthor,
  formatArticleDate,
  readingTimeMinutes,
} from "@/lib/content/blog";
import { pageMetadata } from "@/lib/seo/metadata";
import { articleJsonLd } from "@/lib/seo/structured-data";

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return articleSlugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticle(slug, locale as AppLocale);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/blog/${article.slug}`,
    ogType: "article",
    locale: locale as AppLocale,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale as AppLocale);
  const article = getArticle(slug, locale as AppLocale);
  if (!article) notFound();

  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "blog",
  });
  const tContent = await getTranslations({
    locale: locale as AppLocale,
    namespace: "content",
  });
  const heroAlt = article.heroImage.altKey
    ? tContent(article.heroImage.altKey as never)
    : article.heroImage.alt;

  return (
    <>
      <div className="bg-mist">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <Breadcrumbs
            items={[
              { label: t("index.breadcrumb"), href: "/blog" },
              { label: article.title, href: `/blog/${article.slug}` },
            ]}
          />
          <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-forest text-balance sm:text-5xl lg:mt-12">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink/75">
            {article.description}
          </p>
          <p className="mt-5 text-sm text-ink/70">
            {articleAuthor} ·{" "}
            <time dateTime={article.publishedAt}>
              {formatArticleDate(article.publishedAt, locale as AppLocale)}
            </time>
            {article.updatedAt !== article.publishedAt ? (
              <>
                {" "}
                · {t("article.updatedLabel")}{" "}
                <time dateTime={article.updatedAt}>
                  {formatArticleDate(article.updatedAt, locale as AppLocale)}
                </time>
              </>
            ) : null}{" "}
            · {t("card.readingTime", { minutes: readingTimeMinutes(article) })}
          </p>
        </div>
      </div>

      <article className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="overflow-hidden rounded-3xl">
            <Image
              src={article.heroImage.src}
              alt={heroAlt}
              width={article.heroImage.width}
              height={article.heroImage.height}
              priority
              sizes="(min-width: 768px) 42rem, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
          <ArticleBody blocks={article.blocks} />
        </div>
      </article>

      <StructuredData
        data={articleJsonLd(
          {
            title: article.title,
            description: article.description,
            slug: article.slug,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            image: article.heroImage.src,
          },
          locale as AppLocale,
        )}
      />

      <CallToAction />
    </>
  );
}
