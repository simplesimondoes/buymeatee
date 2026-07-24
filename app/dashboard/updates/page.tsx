import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UpdateManager } from "@/components/updates/update-manager";
import { getOwnUpdates } from "@/lib/updates/updates";
import type { CreatorUpdateRow } from "@/lib/updates/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your updates",
  description: "Post progress updates your supporters can follow.",
  robots: { index: false, follow: false },
};

export default async function UpdatesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fdashboard%2Fupdates");
  }

  let updates: CreatorUpdateRow[] = [];
  let unavailable = false;
  try {
    updates = await getOwnUpdates(user.id);
  } catch {
    unavailable = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        Dashboard
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Updates
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        Show supporters where their backing goes — new features, milestones,
        rounds played. Drafts stay private until you publish them.
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            Updates aren&apos;t available right now. Please try again shortly.
          </div>
        ) : (
          <UpdateManager initialUpdates={updates} />
        )}
      </div>
    </main>
  );
}
