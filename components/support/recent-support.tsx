import { useLocale, useTranslations } from "next-intl";

import type { AppLocale } from "@/i18n/locales";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { RecentSupportItem } from "@/lib/support/public";

/**
 * Recent supporters as social proof. Names already have the anonymity choice
 * applied upstream; messages and names render as plain text (React-escaped),
 * never markdown. No amounts-are-invented risk: these are verified paid gifts.
 */
export function RecentSupport({
  items,
}: {
  items: RecentSupportItem[];
}) {
  const t = useTranslations("profilePage.recentSupport");
  const locale = useLocale() as AppLocale;

  if (items.length === 0) {
    return (
      <section
        aria-label={t("sectionLabel")}
        className="rounded-3xl border border-dashed border-stone bg-mist p-6 text-center"
      >
        <p className="text-sm leading-relaxed text-ink/70">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section aria-label={t("sectionLabel")} className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-forest">
        {t("heading")}
      </h2>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="rounded-2xl border border-stone bg-white p-4 sm:p-5"
          >
            <p className="text-sm text-ink">
              {t.rich("supported", {
                name: item.displayName,
                amount: formatMinorAmount(item.amount, item.currency, locale),
                supporter: (chunks) => (
                  <span className="font-semibold text-forest">{chunks}</span>
                ),
                sum: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
              {item.target ? (
                <span className="text-ink/60">
                  {" "}
                  ·{" "}
                  {item.target.kind === "wishlist"
                    ? t("fundedItem", { title: item.target.title })
                    : t("towardGoal", { title: item.target.title })}
                </span>
              ) : null}
            </p>
            {item.message ? (
              <p className="mt-1.5 text-sm italic leading-relaxed text-ink/70">
                &ldquo;{item.message}&rdquo;
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
