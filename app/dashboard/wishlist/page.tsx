import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WishlistManager } from "@/components/wishlist/wishlist-manager";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getOwnItems } from "@/lib/wishlist/items";
import type { WishlistItemRow } from "@/lib/wishlist/types";

export const metadata: Metadata = {
  title: "Your wish list",
  description: "List the specific things supporters can fund for your journey.",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fdashboard%2Fwishlist");
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
        Dashboard
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Wish list
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        List specific things a supporter can fund outright — a box of balls, a
        tournament entry, a coaching session, a beer after a round. They sit
        alongside your bigger goals. An item shows as funded only once a real
        Tee pays for it.
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            Your wish list isn&apos;t available right now. Please try again
            shortly.
          </div>
        ) : (
          <WishlistManager initialItems={items} payoutCurrency={payoutCurrency} />
        )}
      </div>
    </main>
  );
}
