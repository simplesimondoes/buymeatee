import { Banknote, Lock, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { Link } from "@/i18n/navigation";
import { images } from "@/lib/content/images";

export function Hero() {
  const t = useTranslations("home");
  const hero = images.heroJourney;
  return (
    <section className="on-dark relative isolate overflow-hidden bg-forest-dark">
      {/* Full-bleed photography leads; a bottom-up scrim keeps the copy
          readable without hiding the image. */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src={hero.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-forest-dark/65 to-forest-dark/20 sm:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-forest-dark/80 via-forest-dark/35 to-forest-dark/5 sm:block" />
      </div>
      <div className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col justify-end px-4 pb-14 pt-40 sm:min-h-[38rem] sm:px-6 sm:pb-16 lg:min-h-[44rem] lg:px-8 lg:pb-20">
        <div className="max-w-2xl">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-white text-balance sm:text-6xl lg:text-[4.5rem] lg:leading-[1.02]">
            {t("hero.heading")}
          </h1>
          <p className="mt-5 font-serif text-2xl text-white/95 sm:text-3xl sm:text-gold">
            {t("hero.tagline")}
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            {t("hero.intro")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/sign-in" variant="onDark" size="lg">
              {t("hero.startCta")}
            </ButtonLink>
            <Link
              href="/discover"
              className="inline-flex min-h-11 items-center justify-center px-2 font-medium text-white underline-offset-4 hover:underline"
            >
              {t("hero.exploreCta")}
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/70">{t("hero.reassurance")}</p>
          <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/20 pt-5 text-sm text-white/75">
            <li className="inline-flex items-center gap-2">
              <Lock aria-hidden="true" className="size-4 text-gold" />
              <span>
                {t.rich("hero.trust.stripe", {
                  strong: (chunks) => (
                    <span className="font-semibold text-white">{chunks}</span>
                  ),
                })}
              </span>
            </li>
            <li className="inline-flex items-center gap-2">
              <Users aria-hidden="true" className="size-4 text-gold" />
              {t("hero.trust.supporters")}
            </li>
            <li className="inline-flex items-center gap-2">
              <Banknote aria-hidden="true" className="size-4 text-gold" />
              {t("hero.trust.payouts")}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
