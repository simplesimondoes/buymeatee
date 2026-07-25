import {
  Camera,
  CircleCheck,
  Compass,
  GraduationCap,
  Map,
  Medal,
  Star,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ComponentType } from "react";

import { ButtonLink } from "@/components/button-link";
import { CallToAction } from "@/components/call-to-action";
import { GoalCard } from "@/components/goal-card";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import type { AppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { exampleGoalItems } from "@/lib/content/example-goals";
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
    title: t("meta.forCreators.title"),
    description: t("meta.forCreators.description"),
    path: "/for-creators",
    locale: locale as AppLocale,
  });
}

/** Ids under `marketing.forCreators.who.audiences`. */
const audiences: {
  id: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "youtube", icon: Video },
  { id: "shortForm", icon: Camera },
  { id: "amateur", icon: Trophy },
  { id: "aspiringPro", icon: Medal },
  { id: "coaches", icon: GraduationCap },
  { id: "reviewers", icon: Star },
  { id: "travel", icon: Map },
  { id: "womens", icon: Users },
  { id: "adaptive", icon: Compass },
];

/** Ids under `marketing.forCreators.benefits.items`. */
const benefitIds = ["story", "support", "updates", "celebrate", "time"] as const;

/** Ids under `marketing.forCreators.workflow.steps`. */
const workflowIds = [
  "createPage",
  "addGoal",
  "shareLink",
  "receiveSupport",
  "postUpdates",
  "reachGoal",
] as const;

export default async function ForCreatorsPage({
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
  const photo = images.creatorVloggingGolf;
  const photoAlt = photo.altKey ? tContent(photo.altKey as never) : photo.alt;
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("forCreators.breadcrumb"), href: "/for-creators" },
        ]}
        eyebrow={t("forCreators.eyebrow")}
        heading={t("forCreators.heading")}
        intro={t("forCreators.intro")}
      />

      {/* Who it's for */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <SectionHeading
                eyebrow={t("forCreators.who.eyebrow")}
                heading={t("forCreators.who.heading")}
                intro={t("forCreators.who.intro")}
                align="left"
              />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {audiences.map(({ id, icon: Icon }) => (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-2xl border border-stone bg-white px-4 py-3 text-sm text-ink/80"
                  >
                    <span className="text-gold-deep">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    {t(`forCreators.who.audiences.${id}` as never)}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-ink/70">
                {t("forCreators.who.juniorsNote")}
              </p>
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
        </div>
      </section>

      {/* Goal-based support */}
      <section className="on-dark bg-forest">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("forCreators.goals.eyebrow")}
            heading={t("forCreators.goals.heading")}
            intro={t("forCreators.goals.intro")}
            tone="dark"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exampleGoalItems.slice(0, 3).map((item) => (
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

      {/* Benefits */}
      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("forCreators.benefits.eyebrow")}
            heading={t("forCreators.benefits.heading")}
          />
          <ul className="mx-auto mt-10 max-w-2xl space-y-4">
            {benefitIds.map((id) => (
              <li
                key={id}
                className="flex items-start gap-3 rounded-2xl bg-white px-5 py-4 text-ink/80"
              >
                <CircleCheck
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                />
                {t(`forCreators.benefits.items.${id}` as never)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Creator workflow */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("forCreators.workflow.eyebrow")}
            heading={t("forCreators.workflow.heading")}
            intro={t("forCreators.workflow.intro")}
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workflowIds.map((id, index) => (
              <li
                key={id}
                className="rounded-2xl border border-stone bg-white p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                  {t("forCreators.workflow.stepLabel", { number: index + 1 })}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-forest">
                  {t(`forCreators.workflow.steps.${id}.title` as never)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {t(`forCreators.workflow.steps.${id}.body` as never)}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm text-ink/70">
            {t.rich("forCreators.workflow.supporterView", {
              link: (chunks) => (
                <Link
                  href="/for-supporters"
                  className="font-medium text-gold-deep underline hover:text-forest"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <div className="mt-10 text-center">
            <ButtonLink href="/sign-in" size="lg">
              {t("forCreators.workflow.startCta")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <CallToAction
        heading={t("forCreators.cta.heading")}
        body={t("forCreators.cta.body")}
      />
    </>
  );
}
