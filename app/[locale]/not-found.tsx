import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/button-link";

export async function generateMetadata(): Promise<Metadata> {
  // No params here — the plain form infers the request locale.
  const t = await getTranslations("marketing");
  return { title: t("notFound.metaTitle") };
}

export default async function NotFound() {
  const t = await getTranslations("marketing");
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
          404
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
          {t("notFound.heading")}
        </h1>
        <p className="mt-4 text-lg text-ink/70">{t("notFound.body")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">{t("notFound.backHome")}</ButtonLink>
          <ButtonLink href="/how-it-works" variant="secondary">
            {t("notFound.howItWorks")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
