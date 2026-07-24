import type { ReactNode } from "react";

import { ExampleBadge } from "@/components/example-badge";
import { SectionHeading } from "@/components/section-heading";

type DiscoverRowProps = {
  eyebrow?: string;
  heading: string;
  intro?: string;
  /** Show the Preview label + note when the section is illustrative. */
  preview?: boolean;
  /** Note shown next to the Preview badge (defaults to a generic message). */
  previewNote?: string;
  layout?: "carousel" | "grid";
  /** Optional trailing control (e.g. a "Browse all" link). */
  action?: ReactNode;
  /** Section background — sections alternate white / mist. */
  background?: "white" | "mist";
  children: ReactNode;
};

/**
 * A titled Discover section. `carousel` lays cards out as a horizontal,
 * snap-scrolling rail (used for creator rails and secondary goal rows);
 * `grid` is the marquee layout for Featured Goals.
 */
export function DiscoverRow({
  eyebrow,
  heading,
  intro,
  preview = false,
  previewNote = "Illustrative for now — real entries appear here as creators join.",
  layout = "carousel",
  action,
  background = "white",
  children,
}: DiscoverRowProps) {
  return (
    <section className={background === "mist" ? "bg-mist" : "bg-white"}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <SectionHeading
              eyebrow={eyebrow}
              heading={heading}
              intro={intro}
              align="left"
            />
            {preview ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink/60">
                <ExampleBadge label="Preview" />
                {previewNote}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {layout === "grid" ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
        ) : (
          <div className="-mx-4 mt-10 sm:mx-0">
            <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {children}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/** A fixed-width slide for the carousel layout. */
export function DiscoverSlide({ children }: { children: ReactNode }) {
  return (
    <li className="w-[17rem] shrink-0 snap-start sm:w-80">{children}</li>
  );
}
