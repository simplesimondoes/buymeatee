import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
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
    title: t("meta.about.title"),
    description: t("meta.about.description"),
    path: "/about",
    locale: locale as AppLocale,
  });
}

export default async function AboutPage({
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
  const photo = images.flagAtSunset;
  const photoAlt = photo.altKey ? tContent(photo.altKey as never) : photo.alt;
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t("about.breadcrumb"), href: "/about" }]}
        eyebrow={t("about.eyebrow")}
        heading={t("about.heading")}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <blockquote className="border-l-4 border-gold pl-6 font-serif text-2xl font-medium leading-snug text-forest sm:text-3xl">
            {t("about.quote")}
          </blockquote>

          <div className="mt-12 space-y-6 text-base leading-relaxed text-ink/80">
            <p>{t("about.paragraphGap")}</p>
            <p>{t("about.paragraphClose")}</p>
            <p>
              {t.rich("about.paragraphJoin", {
                link: (chunks) => (
                  <Link
                    href="/sign-in"
                    className="font-medium text-gold-deep underline hover:text-forest"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>

          <div className="mt-14 overflow-hidden rounded-3xl">
            <Image
              src={photo.src}
              alt={photoAlt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 768px) 42rem, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      <CallToAction
        heading={t("about.cta.heading")}
        body={t("about.cta.body")}
      />
    </>
  );
}
