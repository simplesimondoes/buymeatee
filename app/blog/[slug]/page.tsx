import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/article-body";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallToAction } from "@/components/call-to-action";
import { StructuredData } from "@/components/structured-data";
import {
  articleAuthor,
  articles,
  formatArticleDate,
  getArticleBySlug,
  readingTimeMinutes,
} from "@/lib/content/blog";
import { pageMetadata } from "@/lib/seo/metadata";
import { articleJsonLd } from "@/lib/seo/structured-data";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/blog/${article.slug}`,
    ogType: "article",
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <div className="bg-mist">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <Breadcrumbs
            items={[
              { label: "Blog", href: "/blog" },
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
              {formatArticleDate(article.publishedAt)}
            </time>
            {article.updatedAt !== article.publishedAt ? (
              <>
                {" "}
                · Updated{" "}
                <time dateTime={article.updatedAt}>
                  {formatArticleDate(article.updatedAt)}
                </time>
              </>
            ) : null}{" "}
            · {readingTimeMinutes(article)} min read
          </p>
        </div>
      </div>

      <article className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="overflow-hidden rounded-3xl">
            <Image
              src={article.heroImage.src}
              alt={article.heroImage.alt}
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
        data={articleJsonLd({
          title: article.title,
          description: article.description,
          slug: article.slug,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          image: article.heroImage.src,
        })}
      />

      <CallToAction />
    </>
  );
}
