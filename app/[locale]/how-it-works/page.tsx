import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import type { AppLocale } from "@/i18n/locales";
import { images } from "@/lib/content/images";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "marketing",
  });
  return pageMetadata({
    title: t("meta.howItWorks.title"),
    description: t("meta.howItWorks.description"),
    path: "/how-it-works",
    locale: locale as AppLocale,
  });
}

/** Step ids under `marketing.howItWorks.creator.steps` / `.supporter.steps`. */
const creatorJourneyIds = [
  "createPage",
  "shareStory",
  "addGoal",
  "shareLink",
  "receiveSupport",
  "postUpdates",
] as const;

const supporterJourneyIds = [
  "discover",
  "chooseGoal",
  "buyTee",
  "leaveMessage",
  "followProgress",
  "celebrate",
] as const;

function JourneyList({
  steps,
  tone,
}: {
  steps: { title: string; body: string }[];
  tone: "light" | "dark";
}) {
  const numberColour = tone === "dark" ? "text-gold" : "text-gold-deep";
  const titleColour = tone === "dark" ? "text-white" : "text-forest";
  const bodyColour = tone === "dark" ? "text-white/75" : "text-ink/70";
  const divide = tone === "dark" ? "divide-white/15" : "divide-stone";
  return (
    <ol className={`mt-8 divide-y ${divide}`}>
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-5 py-5">
          <span
            className={`font-serif text-2xl font-semibold ${numberColour}`}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className={`font-serif text-lg font-semibold ${titleColour}`}>
              {step.title}
            </h3>
            <p className={`mt-1 text-sm leading-relaxed ${bodyColour}`}>
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "marketing",
  });
  const tContent = await getTranslations({
    locale: locale as AppLocale,
    namespace: "content",
  });
  const photo = images.friendsWalkingFairway;
  const photoAlt = photo.altKey ? tContent(photo.altKey as never) : photo.alt;

  const creatorJourney = creatorJourneyIds.map((id) => ({
    title: t(`howItWorks.creator.steps.${id}.title` as never),
    body: t(`howItWorks.creator.steps.${id}.body` as never),
  }));
  const supporterJourney = supporterJourneyIds.map((id) => ({
    title: t(`howItWorks.supporter.steps.${id}.title` as never),
    body: t(`howItWorks.supporter.steps.${id}.body` as never),
  }));

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("howItWorks.breadcrumb"), href: "/how-it-works" },
        ]}
        eyebrow={t("howItWorks.eyebrow")}
        heading={t("howItWorks.heading")}
        intro={t("howItWorks.intro")}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="mx-auto max-w-2xl text-center text-sm text-ink/70">
            {t("howItWorks.lead")}
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="on-dark rounded-3xl bg-forest p-6 sm:p-8 lg:p-10">
              <SectionHeading
                eyebrow={t("howItWorks.creator.eyebrow")}
                heading={t("howItWorks.creator.heading")}
                align="left"
                tone="dark"
                as="h2"
              />
              <JourneyList steps={creatorJourney} tone="dark" />
            </div>
            <div className="rounded-3xl border border-stone bg-white p-6 sm:p-8 lg:p-10">
              <SectionHeading
                eyebrow={t("howItWorks.supporter.eyebrow")}
                heading={t("howItWorks.supporter.heading")}
                align="left"
                as="h2"
              />
              <JourneyList steps={supporterJourney} tone="light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mist">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
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
          <SectionHeading
            eyebrow={t("howItWorks.why.eyebrow")}
            heading={t("howItWorks.why.heading")}
            align="left"
            intro={t("howItWorks.why.intro")}
          />
        </div>
      </section>

      <CallToAction />
    </>
  );
}
