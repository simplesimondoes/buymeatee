import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { SectionHeading } from "@/components/section-heading";
import { Link } from "@/i18n/navigation";
import { audiences } from "@/lib/content/audiences";

/**
 * The nine audience cards behind "For Golfers With a Goal." — each links to
 * its dedicated landing page under /for/<slug> (ADR-021).
 */
export function AudienceGrid() {
  const t = useTranslations("home");
  const tAudiences = useTranslations("audiences");
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
            return (
              <li key={audience.slug}>
                <Link
                  href={`/for/${audience.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-stone bg-white p-6 transition hover:border-gold"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-forest">
                    {tAudiences(`${audience.id}.label` as never)}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/70">
                    {tAudiences(`${audience.id}.tagline` as never)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-deep transition group-hover:text-forest">
                    {t("audienceGrid.cardCta")}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
