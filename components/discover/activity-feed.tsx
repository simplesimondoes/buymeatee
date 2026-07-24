import { Heart } from "lucide-react";

import { ExampleBadge } from "@/components/example-badge";
import { SectionHeading } from "@/components/section-heading";
import { previewActivity } from "@/lib/content/preview-creators";

/**
 * "Recently Funded" social-proof feed.
 *
 * Shown as a Concept only: there is no public gift-activity pipeline yet, and
 * real supporter names must never be invented or exposed here. When a
 * privacy-respecting activity feed exists, it replaces this illustration.
 */
export function ActivityFeed() {
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <SectionHeading
            eyebrow="Recently funded"
            heading="The platform, alive with support"
            intro="A glimpse of how supporter activity will keep Discover moving."
            align="left"
          />
          <p className="mt-3 flex items-center gap-2 text-sm text-ink/60">
            <ExampleBadge label="Concept" />
            Illustrative activity — no real supporters or gifts are shown.
          </p>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {previewActivity.map((item, index) => (
            <li
              key={index}
              className="flex items-center gap-3 rounded-2xl border border-stone bg-white px-4 py-3"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-gold-deep">
                <Heart aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-sm text-ink/80">
                <span className="font-medium text-forest">{item.supporter}</span>{" "}
                {item.action} {item.target}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
