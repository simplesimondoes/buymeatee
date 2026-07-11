import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { StructuredData } from "@/components/structured-data";
import {
  breadcrumbJsonLd,
  type BreadcrumbItem,
} from "@/lib/seo/structured-data";

type BreadcrumbsProps = {
  /** Trail including the current page as the last item. Home is added automatically. */
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const trail: BreadcrumbItem[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-ink/70">
        {trail.map((item, index) => {
          const isCurrent = index === trail.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-ink/40"
                />
              ) : null}
              {isCurrent ? (
                <span aria-current="page" className="font-medium text-forest">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-forest"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <StructuredData data={breadcrumbJsonLd(trail)} />
    </nav>
  );
}
