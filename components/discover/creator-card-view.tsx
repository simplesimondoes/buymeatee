import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/profile/avatar";
import { usePreviewText } from "@/components/discover/preview-text";
import type { AppLocale } from "@/i18n/locales";
import { categoryLabelKey } from "@/lib/discover/categories";
import type { DiscoverCreatorCard } from "@/lib/discover/types";
import { formatPercent } from "@/lib/i18n/format";

/** A creator as browsed on Discover — real or clearly-labelled Preview. */
export function CreatorCardView({ creator }: { creator: DiscoverCreatorCard }) {
  const t = useTranslations("discover");
  const locale = useLocale() as AppLocale;
  const text = usePreviewText(creator.isPreview);

  const category = creator.category
    ? t(categoryLabelKey(creator.category) as never)
    : null;
  const place = text(creator.location) ?? text(creator.country);
  const bio = text(creator.bio);
  const updateNote = text(creator.updateNote);
  const goalTitle = creator.currentGoal ? text(creator.currentGoal.title) : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <div className="relative aspect-[5/2] w-full overflow-hidden bg-mist">
        {creator.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.imageSrc}
            alt={text(creator.imageAlt)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-forest to-forest-dark" />
        )}
        {creator.isPreview ? (
          <ExampleBadge label="Preview" className="absolute left-3 top-3" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-8">
          <div className="inline-flex rounded-full ring-4 ring-white">
            <Avatar src={creator.avatarUrl} name={creator.name} size="md" />
          </div>
        </div>
        <h3 className="mt-3 font-serif text-lg font-semibold text-forest">
          {creator.name}
        </h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/60">
          {place ? (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {place}
            </span>
          ) : null}
          {category ? (
            <>
              {place ? <span aria-hidden="true" className="text-ink/30">·</span> : null}
              <span>{category}</span>
            </>
          ) : null}
        </div>
        {bio ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/75">
            {bio}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        {updateNote ? (
          <p className="mt-3 rounded-xl bg-mist px-3 py-2 text-xs leading-relaxed text-ink/70">
            {updateNote}
          </p>
        ) : null}
        {creator.currentGoal && goalTitle ? (
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-xs">
              <span className="truncate pr-2 font-medium text-ink/80">
                {goalTitle}
              </span>
              <span className="shrink-0 font-semibold text-gold-deep">
                {creator.currentGoal.started
                  ? formatPercent(creator.currentGoal.percent, locale)
                  : t("creatorCard.new")}
              </span>
            </div>
            <ProgressBar
              value={creator.currentGoal.percent}
              label={t("creatorCard.progressLabel", {
                name: creator.name,
                title: goalTitle,
              })}
              className="mt-1.5"
            />
          </div>
        ) : null}
        {creator.href ? (
          <Link
            href={creator.href}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            {t("creatorCard.support")}
          </Link>
        ) : (
          <Link
            href="/how-it-works"
            className="mt-5 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
          >
            {t("creatorCard.seeHowItWorks")}
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </Link>
        )}
      </div>
    </article>
  );
}
