import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/button-link";
import { GoalCardView } from "@/components/discover/goal-card-view";
import { SectionHeading } from "@/components/section-heading";
import { getFeaturedGoals } from "@/lib/discover/data";

/**
 * Featured golfers on the homepage (ADR-021): the Discover hybrid rule —
 * real published goals when any exist, otherwise clearly-labelled Preview
 * examples (each card carries its own Preview badge), with an honest note.
 */
export async function FeaturedGolfersSection() {
  const t = await getTranslations("home");
  const featured = await getFeaturedGoals(3);
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("featuredGolfers.eyebrow")}
          heading={t("featuredGolfers.heading")}
          intro={t("featuredGolfers.intro")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.items.map((goal) => (
            <GoalCardView key={goal.key} goal={goal} />
          ))}
        </div>
        {featured.preview ? (
          <p className="mt-6 text-center text-sm text-ink/60">
            {t("featuredGolfers.previewNote")}
          </p>
        ) : null}
        <div className="mt-10 text-center">
          <ButtonLink href="/discover" variant="secondary">
            {t("featuredGolfers.cta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
