import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  formatArticleDate,
  readingTimeMinutes,
  type Article,
} from "@/lib/content/blog";

export function BlogCard({ article }: { article: Article }) {
  const t = useTranslations("blog");
  const tContent = useTranslations("content");
  const locale = useLocale();
  const heroAlt = article.heroImage.altKey
    ? tContent(article.heroImage.altKey as never)
    : article.heroImage.alt;
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <Image
        src={article.heroImage.src}
        alt={heroAlt}
        width={article.heroImage.width}
        height={article.heroImage.height}
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
        className="h-44 w-full object-cover"
      />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs text-ink/70">
          <time dateTime={article.publishedAt}>
            {formatArticleDate(article.publishedAt, locale)}
          </time>{" "}
          · {t("card.readingTime", { minutes: readingTimeMinutes(article) })}
        </p>
        <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-forest">
          <Link
            href={`/blog/${article.slug}`}
            className="hover:underline"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
          {article.description}
        </p>
        <p className="mt-4 text-sm font-medium text-gold-deep">
          {t("card.readArticle")} <span aria-hidden="true">→</span>
        </p>
      </div>
    </article>
  );
}
