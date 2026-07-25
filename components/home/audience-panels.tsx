import { CircleCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { CreatorPreviewCard } from "@/components/creator-preview-card";
import { ExampleBadge } from "@/components/example-badge";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/lib/content/images";

/** Point ids under `audiences.creators.points` / `audiences.supporters.points`. */
const creatorPointIds = [
  "story",
  "support",
  "updates",
  "milestones",
  "time",
] as const;

const supporterPointIds = [
  "buy",
  "follow",
  "story",
  "discover",
  "celebrate",
] as const;

function PointList({
  points,
  tone,
}: {
  points: string[];
  tone: "light" | "dark";
}) {
  const text = tone === "dark" ? "text-white/85" : "text-ink/75";
  const icon = tone === "dark" ? "text-gold" : "text-gold-deep";
  return (
    <ul className="mt-6 space-y-3">
      {points.map((point) => (
        <li key={point} className={`flex items-start gap-3 text-sm ${text}`}>
          <CircleCheck
            aria-hidden="true"
            className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${icon}`}
          />
          {point}
        </li>
      ))}
    </ul>
  );
}

/** Concept app screen from the approved UI mockups (labelled Concept — ADR-007). */
function SupporterCollectionConcept() {
  const tContent = useTranslations("content");
  const screen = images.appConceptSupporterCollection;
  const screenAlt = screen.altKey
    ? tContent(screen.altKey as never)
    : screen.alt;
  return (
    <figure className="relative mx-auto w-full max-w-[280px]">
      <div className="absolute right-3 top-3 z-10">
        <ExampleBadge label="Concept" />
      </div>
      <Image
        src={screen.src}
        alt={screenAlt}
        width={screen.width}
        height={screen.height}
        sizes="280px"
        className="h-auto w-full rounded-[1.9rem] shadow-xl ring-1 ring-ink/10"
      />
    </figure>
  );
}

export function AudiencePanels() {
  const t = useTranslations("home");
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("audiences.eyebrow")}
          heading={t("audiences.heading")}
          intro={t("audiences.intro")}
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Creator panel */}
          <div className="on-dark flex flex-col rounded-3xl bg-forest p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {t("audiences.creators.eyebrow")}
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">
              {t("audiences.creators.heading")}
            </h3>
            <PointList
              points={creatorPointIds.map((id) =>
                t(`audiences.creators.points.${id}` as never),
              )}
              tone="dark"
            />
            <div className="mt-8">
              <ButtonLink href="/sign-in" variant="onDark">
                {t("audiences.creators.cta")}
              </ButtonLink>
            </div>
            <div className="mt-8 max-w-sm">
              <CreatorPreviewCard />
            </div>
          </div>
          {/* Supporter panel */}
          <div className="flex flex-col rounded-3xl border border-stone bg-white p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
              {t("audiences.supporters.eyebrow")}
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-forest sm:text-3xl">
              {t("audiences.supporters.heading")}
            </h3>
            <PointList
              points={supporterPointIds.map((id) =>
                t(`audiences.supporters.points.${id}` as never),
              )}
              tone="light"
            />
            <div className="mt-8">
              <ButtonLink href="/sign-in">
                {t("audiences.supporters.cta")}
              </ButtonLink>
            </div>
            <div className="mt-8">
              <SupporterCollectionConcept />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
