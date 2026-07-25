import { Flag, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

import { ExampleBadge } from "@/components/example-badge";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/lib/content/images";

/** Display strings live in the `home` namespace under `tipJar.features.<id>`. */
const features: { id: string; icon: ComponentType<{ className?: string }> }[] =
  [
    { id: "goalBased", icon: Target },
    { id: "secure", icon: ShieldCheck },
    { id: "community", icon: HeartHandshake },
    { id: "golf", icon: Flag },
  ];

export function TipJarSection() {
  const t = useTranslations("home");
  const tContent = useTranslations("content");
  const screen = images.appConceptCreatorProfile;
  const screenAlt = screen.altKey
    ? tContent(screen.altKey as never)
    : screen.alt;
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              heading={t("tipJar.heading")}
              intro={t("tipJar.intro")}
            />
            <ul className="mt-10 grid gap-8 sm:grid-cols-2">
              {features.map(({ id, icon: Icon }) => (
                <li key={id} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-gold">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-forest">
                      {t(`tipJar.features.${id}.title` as never)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                      {t(`tipJar.features.${id}.body` as never)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Concept app screen from the approved UI mockups (ADR-007) */}
          <figure className="relative mx-auto w-full max-w-[300px]">
            <div className="absolute right-3 top-3 z-10">
              <ExampleBadge label="Concept" />
            </div>
            <Image
              src={screen.src}
              alt={screenAlt}
              width={screen.width}
              height={screen.height}
              sizes="300px"
              className="h-auto w-full rounded-[2rem] shadow-xl ring-1 ring-ink/10"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
