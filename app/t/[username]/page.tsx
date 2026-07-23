import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { GiftComposer } from "@/components/payments/gift-composer";
import { PublicGoals } from "@/components/goals/public-goals";
import { Avatar } from "@/components/profile/avatar";
import { getPublicGoalsForCreator, type PublicGoals as PublicGoalsData } from "@/lib/goals/public";
import { getFeeConfig, PRESET_GIFT_AMOUNTS } from "@/lib/payments/config";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import { canReceiveGifts } from "@/lib/payments/types";
import { isLivemode } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Public recipient profile: "Buy [name] a Tee". Exposes only intentional
 * public data — never Stripe ids, restriction reasons or requirement lists.
 */

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  deactivated_at: string | null;
};

const loadProfile = cache(async (username: string): Promise<ProfileRow | null> => {
  if (!/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/.test(username)) {
    return null;
  }
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, deactivated_at")
    .eq("username", username)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
});

const loadPublicGoals = cache(
  async (creatorId: string): Promise<PublicGoalsData> => {
    try {
      return await getPublicGoalsForCreator(creatorId);
    } catch {
      // Goals unavailable: the page still works as general support.
      return { active: [], completed: [] };
    }
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username.toLowerCase()).catch(() => null);
  if (profile?.deactivated_at) {
    return {
      title: "Page unavailable",
      robots: { index: false, follow: false },
    };
  }
  const name = profile?.display_name || username;
  const goals = profile ? await loadPublicGoals(profile.id) : { active: [] };
  return {
    title: `Buy ${name} a Tee`,
    description:
      goals.active.length > 0
        ? `Support ${name}'s golf journey with a Tee — back a real goal and watch it happen.`
        : `Support ${name}'s golf journey with a Tee.`,
    // Pre-launch: profile pages exist for early recipients only.
    robots: { index: false, follow: false },
  };
}

export default async function RecipientProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await loadProfile(username.toLowerCase()).catch(() => null);
  if (!profile) {
    notFound();
  }

  // Admin takedown: an honest, neutral unavailable state — no profile
  // content, no blame, and new Tees are refused server-side too.
  if (profile.deactivated_at) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-3xl border border-stone bg-mist p-8 text-center">
          <h1 className="font-serif text-2xl font-semibold text-forest">
            This page isn&apos;t available right now.
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
            It can&apos;t receive Tees at the moment. If you think this is a
            mistake, please check back later.
          </p>
        </div>
      </main>
    );
  }

  let ready = false;
  let currency: "gbp" | "eur" = "gbp";
  try {
    const account = await getConnectedAccountForUser(profile.id);
    ready =
      canReceiveGifts(account) && (account?.livemode ?? false) === isLivemode();
    currency = account?.default_currency ?? "gbp";
  } catch {
    ready = false;
  }

  const viewer = await getAuthenticatedUser().catch(() => null);
  const isOwner = viewer?.id === profile.id;
  const name = profile.display_name || profile.username;

  const goals = await loadPublicGoals(profile.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
            Support the journey
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
            Buy {name} a Tee
          </h1>
        </div>
        <Avatar src={profile.avatar_url} name={name} size="lg" />
      </div>
      {profile.bio ? (
        <p className="mt-3 text-base leading-relaxed text-ink/70">
          {profile.bio}
        </p>
      ) : null}

      <div className="mt-8">
        <PublicGoals
          active={goals.active}
          completed={goals.completed}
          creatorName={name}
          isOwner={isOwner}
        />
      </div>

      <div className="mt-8">
        {ready ? (
          <div className="rounded-3xl border border-stone bg-white p-6 sm:p-8">
            <GiftComposer
              recipientUsername={profile.username}
              recipientName={name}
              currency={currency}
              presetAmounts={PRESET_GIFT_AMOUNTS[currency]}
              feeConfig={getFeeConfig()}
              goals={goals.active
                .filter((goal) => goal.currency === currency)
                .map((goal) => ({ id: goal.id, title: goal.title }))}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-stone bg-mist p-6 text-center sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-forest">
              {name} isn&apos;t accepting Tees yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
              Check back soon — their payment setup isn&apos;t finished.
            </p>
            {isOwner ? (
              <Link
                href="/settings/payments"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
              >
                Finish your payment setup
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
