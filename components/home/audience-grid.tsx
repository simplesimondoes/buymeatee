import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { SectionHeading } from "@/components/section-heading";
import { Link } from "@/i18n/navigation";
import { audiences } from "@/lib/content/audiences";
import type { SiteImage } from "@/lib/content/images";

/**
 * The nine audience journeys behind "For Golfers With a Goal." (ADR-021),
 * presented image-first — this single section carries both the who-it's-for
 * story and "the journeys supporters get behind" (it replaced the separate
 * example-goals grid on the homepage; example goal cards still live on the
 * /for/<slug> pages). Each card links to its dedicated landing page.
 */
export function AudienceGrid() {
  const t = useTranslations("home");
  const tAudiences = useTranslations("audiences");
  const tContent = useTranslations("content");
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("audienceGrid.eyebrow")}
          heading={t("audienceGrid.heading")}
          intro={t("audienceGrid.intro")}
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            const photo: SiteImage = audience.image;
            const photoAlt = photo.altKey
              ? tContent(photo.altKey as never)
              : photo.alt;
            return (
              <li key={audience.slug}>
                <Link
                  href={`/for/${audience.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white transition hover:border-gold"
                >
                  <div className="relative">
                    <Image
                      src={photo.src}
                      alt={photoAlt}
                      width={photo.width}
                      height={photo.height}
                      sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-forest/90 text-gold">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-xl font-semibold text-forest">
                      {tAudiences(`${audience.id}.label` as never)}
                    </h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/70">
                      {tAudiences(`${audience.id}.tagline` as never)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-deep transition group-hover:text-forest">
                      {t("audienceGrid.cardCta")}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
