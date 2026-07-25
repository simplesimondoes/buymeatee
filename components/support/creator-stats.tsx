import { useTranslations } from "next-intl";

/**
 * A small, subtle stats strip for a creator page — supporters, goals reached,
 * updates and when they joined. Renders nothing until there's something real
 * to show (no zeroes, no invented traction).
 */
export function CreatorStats({
  supporters,
  goalsReached,
  updates,
  joined,
}: {
  supporters: number;
  goalsReached: number;
  updates: number;
  /** Pre-formatted for the visitor's locale, e.g. "July 2026". */
  joined: string | null;
}) {
  const t = useTranslations("profilePage.stats");

  const counts: { value: number; label: string }[] = [];
  if (supporters > 0) {
    counts.push({ value: supporters, label: t("supporters", { count: supporters }) });
  }
  if (goalsReached > 0) {
    counts.push({
      value: goalsReached,
      label: t("goalsReached", { count: goalsReached }),
    });
  }
  if (updates > 0) {
    counts.push({ value: updates, label: t("updates", { count: updates }) });
  }

  if (counts.length === 0 && !joined) {
    return null;
  }

  return (
    <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-ink/70">
      {counts.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <dt className="sr-only">{item.label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="font-semibold text-forest">{item.value}</span>
            <span>{item.label}</span>
          </dd>
        </div>
      ))}
      {joined ? (
        <div className="flex items-baseline gap-1.5">
          <dt className="sr-only">{t("joinedLabel")}</dt>
          <dd>{t("joined", { date: joined })}</dd>
        </div>
      ) : null}
    </dl>
  );
}
