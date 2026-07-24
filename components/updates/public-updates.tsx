import Link from "next/link";

import { Markdown } from "@/components/markdown";
import type { CreatorUpdateRow } from "@/lib/updates/types";

/**
 * A creator's published updates as supporters see them — a reverse-chronological
 * feed of real progress. Server-rendered; markdown bodies go through the
 * sanitising <Markdown> (ADR-014).
 */

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string | null): string {
  return iso ? dateFormat.format(new Date(iso)) : "";
}

export function PublicUpdates({
  updates,
  creatorName,
  isOwner,
}: {
  updates: CreatorUpdateRow[];
  creatorName: string;
  isOwner: boolean;
}) {
  if (updates.length === 0) {
    if (!isOwner) {
      return null;
    }
    return (
      <section
        aria-label="Updates"
        className="rounded-3xl border border-dashed border-stone bg-mist p-6 text-center"
      >
        <h2 className="font-serif text-lg font-semibold text-forest">
          This journey has only just begun.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          Post updates to show supporters where their backing goes — progress
          is what keeps them coming back.
        </p>
        <Link
          href="/dashboard/updates"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
        >
          Write your first update
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Updates" className="space-y-5">
      <h2 className="font-serif text-xl font-semibold text-forest">
        {creatorName}&apos;s updates
      </h2>
      <ol className="space-y-5">
        {updates.map((update) => (
          <li
            key={update.id}
            className="overflow-hidden rounded-3xl border border-stone bg-white"
          >
            {update.image_url ? (
              <div className="aspect-[16/9] w-full overflow-hidden bg-mist">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={update.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <article className="p-5 sm:p-6">
              <time
                dateTime={update.published_at ?? undefined}
                className="text-xs font-medium uppercase tracking-wide text-gold-deep"
              >
                {formatDate(update.published_at)}
              </time>
              <h3 className="mt-1 font-serif text-lg font-semibold text-forest">
                {update.title}
              </h3>
              <div className="mt-2">
                <Markdown source={update.body} />
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
