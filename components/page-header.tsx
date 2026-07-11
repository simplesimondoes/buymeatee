import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import type { BreadcrumbItem } from "@/lib/seo/structured-data";

type PageHeaderProps = {
  breadcrumbs: BreadcrumbItem[];
  eyebrow?: string;
  heading: string;
  intro?: ReactNode;
};

/** Shared header block for internal marketing pages. */
export function PageHeader({
  breadcrumbs,
  eyebrow,
  heading,
  intro,
}: PageHeaderProps) {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-8">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-8 max-w-3xl lg:mt-12">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-forest text-balance sm:text-5xl">
            {heading}
          </h1>
          {intro ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/75">
              {intro}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
