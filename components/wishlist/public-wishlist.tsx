"use client";

import { CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import type { AppLocale } from "@/i18n/locales";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { SupportedCurrency } from "@/lib/payments/currency";
import {
  scrollToComposer,
  useSupportTarget,
} from "@/components/payments/support-target-context";
import type { WishlistItemRow } from "@/lib/wishlist/types";

/**
 * A creator's wish list as supporters see it. Server-fetched, honest by
 * construction: an item shows as funded only when a real gift paid for it.
 * "Fund this" hands the item to the gift composer (ADR-018); the composer is
 * where payment actually happens.
 */

function AvailableItemCard({
  item,
  fundable,
}: {
  item: WishlistItemRow;
  /** Ready to receive AND in the creator's payout currency, so it can be funded. */
  fundable: boolean;
}) {
  const t = useTranslations("profilePage.wishlist");
  const locale = useLocale() as AppLocale;
  const { select } = useSupportTarget();
  const price = formatMinorAmount(item.price_amount, item.currency, locale);

  function handleFund() {
    select({
      kind: "wishlist",
      id: item.id,
      title: item.title,
      priceAmount: item.price_amount,
    });
    // Bring the composer into view so the supporter can complete the Tee.
    scrollToComposer();
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      {item.image_url ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-base font-semibold text-forest">
          {item.title}
        </h3>
        {item.description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink/75">
            {item.description}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3 pt-1">
          <span className="text-sm font-semibold text-forest">{price}</span>
          {fundable ? (
            <button
              type="button"
              onClick={handleFund}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
            >
              {t("fundThis")}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function PublicWishlist({
  available,
  funded,
  creatorName,
  ready,
  currency,
  isOwner,
}: {
  available: WishlistItemRow[];
  funded: WishlistItemRow[];
  creatorName: string;
  ready: boolean;
  /** The creator's payout currency; items must match it to be fundable. */
  currency: SupportedCurrency;
  isOwner: boolean;
}) {
  const t = useTranslations("profilePage.wishlist");
  const locale = useLocale() as AppLocale;

  if (available.length === 0 && funded.length === 0) {
    if (!isOwner) {
      return null;
    }
    return (
      <section
        aria-label={t("sectionLabel")}
        className="rounded-3xl border border-dashed border-stone bg-mist p-6 text-center"
      >
        <p className="text-sm leading-relaxed text-ink/70">
          {t("emptyOwnerBody")}
        </p>
        <Link
          href="/dashboard/wishlist"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
        >
          {t("addFirstItem")}
        </Link>
      </section>
    );
  }

  return (
    <section aria-label={t("sectionLabel")} className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-semibold text-forest">
          {t("heading", { name: creatorName })}
        </h2>
        <p className="mt-1 text-sm text-ink/70">{t("intro")}</p>
      </div>

      {available.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {available.map((item) => (
            <AvailableItemCard
              key={item.id}
              item={item}
              fundable={ready && item.currency === currency}
            />
          ))}
        </div>
      ) : null}

      {funded.length > 0 ? (
        <div className="rounded-3xl border border-stone bg-mist p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gold-deep">
            {t("fundedHeading")}
          </h3>
          <ul className="mt-3 space-y-2">
            {funded.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 text-sm text-ink/80"
              >
                <CircleCheck
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-forest"
                />
                <span>
                  {item.title}
                  <span className="text-ink/70">
                    {" "}
                    — {formatMinorAmount(item.price_amount, item.currency, locale)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
