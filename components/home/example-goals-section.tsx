import { useTranslations } from "next-intl";

import { GoalCard } from "@/components/goal-card";
import { SectionHeading } from "@/components/section-heading";
import { exampleGoalItems } from "@/lib/content/example-goals";

export function ExampleGoalsSection() {
  const t = useTranslations("home");
  const tContent = useTranslations("content");
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("exampleGoals.eyebrow")}
          heading={t("exampleGoals.heading")}
          intro={t("exampleGoals.intro")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exampleGoalItems.map((item) => (
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
  );
}
