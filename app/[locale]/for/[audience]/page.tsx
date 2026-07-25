import { CircleCheck, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CallToAction } from "@/components/call-to-action";
import { FaqAccordion } from "@/components/faq-accordion";
import { GoalCard } from "@/components/goal-card";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { StructuredData } from "@/components/structured-data";
import type { AppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import {
  audienceSlugs,
  getAudience,
  getAudienceExampleGoals,
} from "@/lib/content/audiences";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqJsonLd } from "@/lib/seo/structured-data";

type AudiencePageProps = {
  params: Promise<{ locale: string; audience: string }>;
};

export function generateStaticParams() {
  return audienceSlugs.map((audience) => ({ audience }));
}

export const dynamicParams = false;

const valueItemIds = ["one", "two", "three"] as const;
const stepIds = ["createPage", "shareGoal", "momentum"] as const;
const faqIds = ["q1", "q2", "q3"] as const;

export async function generateMetadata({
  params,
}: AudiencePageProps): Promise<Metadata> {
  const { locale, audience: slug } = await params;
  const audience = getAudience(slug);
  if (!audience) return {};
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "audiences",
  });
  return pageMetadata({
    title: t(`meta.${audience.id}.title` as never),
    description: t(`meta.${audience.id}.description` as never),
    path: `/for/${audience.slug}`,
    locale: locale as AppLocale,
  });
}

export default async function AudiencePage({ params }: AudiencePageProps) {
  const { locale, audience: slug } = await params;
  setRequestLocale(locale as AppLocale);
  const audience = getAudience(slug);
  if (!audience) notFound();

  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "audiences",
  });
  const tContent = await getTranslations({
    locale: locale as AppLocale,
    namespace: "content",
  });

  const photo = audience.image;
  const photoAlt = photo.altKey ? tContent(photo.altKey as never) : photo.alt;
  const exampleGoals = getAudienceExampleGoals(audience);
  const relatedAudiences = audience.related
    .map((relatedSlug) => getAudience(relatedSlug))
    .filter((related) => related !== undefined);
  const faqs = faqIds.map((id) => ({
    question: t(`${audience.id}.faqs.${id}.question` as never),
    answer: t(`${audience.id}.faqs.${id}.answer` as never),
  }));

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("shared.hubBreadcrumb"), href: "/for-creators" },
          {
            label: t(`${audience.id}.label` as never),
            href: `/for/${audience.slug}`,
          },
        ]}
        eyebrow={t("shared.eyebrow")}
        heading={t(`${audience.id}.heading` as never)}
        intro={t(`${audience.id}.intro` as never)}
      />

      {/* What your page makes possible */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <SectionHeading
                eyebrow={t("shared.valueEyebrow")}
                heading={t(`${audience.id}.value.heading` as never)}
                align="left"
              />
              <ul className="mt-8 space-y-4">
                {valueItemIds.map((id) => (
                  <li
                    key={id}
                    className="flex items-start gap-3 rounded-2xl border border-stone bg-white px-5 py-4 text-ink/80"
                  >
                    <CircleCheck
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                    />
                    {t(`${audience.id}.value.items.${id}` as never)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl">
              <Image
                src={photo.src}
                alt={photoAlt}
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          {audience.guardianLed ? (
            <div className="mt-10 flex items-start gap-4 rounded-3xl border border-gold/40 bg-mist p-6 sm:p-8">
              <ShieldCheck
                aria-hidden="true"
                className="mt-1 h-6 w-6 shrink-0 text-gold-deep"
              />
              <div>
                <h2 className="font-serif text-xl font-semibold text-forest">
                  {t(`${audience.id}.guardian.heading` as never)}
                </h2>
                <p className="mt-2 leading-relaxed text-ink/75">
                  {t(`${audience.id}.guardian.body` as never)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* How it works for you */}
      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("shared.howEyebrow")}
            heading={t("shared.howHeading")}
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stepIds.map((id, index) => (
              <li key={id} className="rounded-2xl bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                  {t("shared.stepLabel", { number: index + 1 })}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-forest">
                  {t(`${audience.id}.how.steps.${id}.title` as never)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {t(`${audience.id}.how.steps.${id}.body` as never)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Example goals */}
      <section className="on-dark bg-forest">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("shared.goalsEyebrow")}
            heading={t("shared.goalsHeading")}
            tone="dark"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {exampleGoals.map((item) => (
              <GoalCard
                key={item.id}
                goal={{
                  title: tContent(item.titleKey as never),
                  creator: tContent(item.creatorKey as never),
                  description: tContent(item.descriptionKey as never),
                  raised: item.raised,
                  target: item.target,
                  image: item.image,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Audience FAQs */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("shared.faqEyebrow")}
            heading={t("shared.faqHeading")}
          />
          <div className="mt-10">
            <FaqAccordion faqs={faqs} />
          </div>
        </div>
      </section>

      {/* FAQ structured data matches the visible questions above (and only
          those), in the same language as the page. */}
      <StructuredData data={faqJsonLd(faqs, locale as AppLocale)} />

      {/* Cross-audience links */}
      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("shared.relatedEyebrow")}
            heading={t("shared.relatedHeading")}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {relatedAudiences.map((related) => {
              const Icon = related.icon;
              return (
                <li key={related.slug}>
                  <Link
                    href={`/for/${related.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-stone bg-white px-5 py-4 text-ink/80 transition hover:border-gold hover:text-forest"
                  >
                    <span className="text-gold-deep">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="font-medium">
                      {t(`${related.id}.label` as never)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-center text-sm text-ink/70">
            <Link
              href="/for-creators"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              {t("shared.hubLink")}
            </Link>
          </p>
        </div>
      </section>

      <CallToAction
        heading={t(`${audience.id}.cta.heading` as never)}
        body={t(`${audience.id}.cta.body` as never)}
      />
    </>
  );
}
