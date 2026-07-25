import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";

type CallToActionProps = {
  /** Already-translated override; defaults come from `marketing.cta`. */
  heading?: string;
  /** Already-translated override; defaults come from `marketing.cta`. */
  body?: string;
};

/** Full-width closing CTA band, reused across marketing pages. */
export function CallToAction({ heading, body }: CallToActionProps) {
  const t = useTranslations("marketing");
  return (
    <section className="on-dark bg-forest">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-white text-balance sm:text-4xl">
          {heading ?? t("cta.defaultHeading")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
          {body ?? t("cta.defaultBody")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/sign-in" variant="onDark" size="lg">
            {t("cta.start")}
          </ButtonLink>
          <ButtonLink href="/how-it-works" variant="onDarkOutline" size="lg">
            {t("cta.how")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
