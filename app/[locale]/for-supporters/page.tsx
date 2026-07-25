import {
  Award,
  Bell,
  CircleAlert,
  Flag,
  Heart,
  Search,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ComponentType } from "react";

import { ButtonLink } from "@/components/button-link";
import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import type { AppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
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
    title: t("meta.forSupporters.title"),
    description: t("meta.forSupporters.description"),
    path: "/for-supporters",
    locale: locale as AppLocale,
  });
}

/** Ids under `marketing.forSupporters.how.steps`. */
const steps: { id: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "discover", icon: Search },
  { id: "chooseGoal", icon: Flag },
  { id: "buyTee", icon: Heart },
  { id: "followProgress", icon: Bell },
  { id: "collect", icon: Award },
];

export default async function ForSupportersPage({
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
  const photo = images.golfersFistBump;
  const photoAlt = photo.altKey ? tContent(photo.altKey as never) : photo.alt;
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("forSupporters.breadcrumb"), href: "/for-supporters" },
        ]}
        eyebrow={t("forSupporters.eyebrow")}
        heading={t("forSupporters.heading")}
        intro={t("forSupporters.intro")}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
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
            <div>
              <SectionHeading
                eyebrow={t("forSupporters.meaning.eyebrow")}
                heading={t("forSupporters.meaning.heading")}
                align="left"
                intro={t("forSupporters.meaning.intro")}
              />
              <p className="mt-6 text-base leading-relaxed text-ink/75">
                {t("forSupporters.meaning.body")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supporter steps */}
      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow={t("forSupporters.how.eyebrow")}
            heading={t("forSupporters.how.heading")}
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ id, icon: Icon }) => (
              <li key={id} className="rounded-2xl bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist text-forest">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-forest">
                  {t(`forSupporters.how.steps.${id}.title` as never)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {t(`forSupporters.how.steps.${id}.body` as never)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Honest boundary */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="rounded-3xl border border-stone bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <CircleAlert
                aria-hidden="true"
                className="mt-1 h-6 w-6 shrink-0 text-gold-deep"
              />
              <div>
                <h2 className="font-serif text-xl font-semibold text-forest">
                  {t("forSupporters.boundary.heading")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  {t("forSupporters.boundary.body")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  {t.rich("forSupporters.boundary.payments", {
                    link: (chunks) => (
                      <Link
                        href="/faq"
                        className="font-medium text-gold-deep underline hover:text-forest"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/sign-in" size="lg">
              {t("forSupporters.boundary.joinCta")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <CallToAction
        heading={t("forSupporters.cta.heading")}
        body={t("forSupporters.cta.body")}
      />
    </>
  );
}
