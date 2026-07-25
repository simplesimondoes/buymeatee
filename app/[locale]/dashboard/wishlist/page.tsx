import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { WishlistManager } from "@/components/wishlist/wishlist-manager";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getOwnItems } from "@/lib/wishlist/items";
import type { WishlistItemRow } from "@/lib/wishlist/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "dashboard",
  });
  return {
    title: t("meta.wishlist.title"),
    description: t("meta.wishlist.description"),
    robots: { index: false, follow: false },
  };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "dashboard",
  });

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/dashboard/wishlist`)}`,
      locale: locale as AppLocale,
    });
  }

  let items: WishlistItemRow[] = [];
  let unavailable = false;
  try {
    items = await getOwnItems(user.id);
  } catch {
    unavailable = true;
  }

  // Lock new items to the creator's payout currency (if their account is set
  // up), so they can't create an item supporters are unable to fund.
  let payoutCurrency: SupportedCurrency | undefined;
  try {
    const account = await getConnectedAccountForUser(user.id);
    payoutCurrency = account?.default_currency ?? undefined;
  } catch {
    payoutCurrency = undefined;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("wishlist.page.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {t("wishlist.page.intro")}
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            {t("wishlist.page.unavailable")}
          </div>
        ) : (
          <WishlistManager initialItems={items} payoutCurrency={payoutCurrency} />
        )}
      </div>
    </main>
  );
}
