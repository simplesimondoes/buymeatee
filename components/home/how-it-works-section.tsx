import { Flag, Landmark, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";

/** Display strings live in the `home` namespace under `howItWorks.steps.<id>`. */
const steps: { id: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "share", icon: UserRound },
  { id: "buy", icon: Landmark },
  { id: "journey", icon: Flag },
];

export function HowItWorksSection() {
  const t = useTranslations("home");
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("howItWorks.eyebrow")}
          heading={t("howItWorks.heading")}
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-10">
          {steps.map(({ id, icon: Icon }, index) => (
            <li key={id} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist text-forest">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                {t("howItWorks.stepLabel", { number: index + 1 })}
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-forest">
                {t(`howItWorks.steps.${id}.title` as never)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {t(`howItWorks.steps.${id}.body` as never)}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <ButtonLink href="/how-it-works">{t("howItWorks.cta")}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
