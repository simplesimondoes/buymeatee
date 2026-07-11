import { GoalCard } from "@/components/goal-card";
import { SectionHeading } from "@/components/section-heading";
import { exampleGoals } from "@/lib/content/example-goals";

export function ExampleGoalsSection() {
  return (
    <section className="bg-offwhite">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Example goals"
          heading="The journeys supporters get behind"
          intro="Illustrations of what creators will share — real pages arrive with launch."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exampleGoals.map((goal) => (
            <GoalCard key={goal.title} goal={goal} />
          ))}
        </div>
      </div>
    </section>
  );
}
