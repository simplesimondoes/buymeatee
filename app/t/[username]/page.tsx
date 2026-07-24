import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Globe } from "lucide-react";

import { GiftComposer } from "@/components/payments/gift-composer";
import { PublicGoals } from "@/components/goals/public-goals";
import { Markdown } from "@/components/markdown";
import { Avatar } from "@/components/profile/avatar";
import { PinnedMedia } from "@/components/profile/pinned-media";
import { PublicUpdates } from "@/components/updates/public-updates";
import { CreatorStats } from "@/components/support/creator-stats";
import { RecentSupport } from "@/components/support/recent-support";
import { getPublicGoalsForCreator, type PublicGoals as PublicGoalsData } from "@/lib/goals/public";
import { getPublishedUpdatesForCreator } from "@/lib/updates/public";
import type { CreatorUpdateRow } from "@/lib/updates/types";
import { getCreatorSupport, type CreatorSupport } from "@/lib/support/public";
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
  cover_image_url: string | null;
  bio: string | null;
  about: string | null;
  handicap: number | null;
  location: string | null;
  home_club: string | null;
  handedness: "left" | "right" | null;
  social_youtube: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_website: string | null;
  pinned_media_url: string | null;
  created_at: string | null;
  deactivated_at: string | null;
};

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, cover_image_url, bio, about, handicap, location, home_club, handedness, social_youtube, social_instagram, social_tiktok, social_website, pinned_media_url, created_at, deactivated_at";

const loadProfile = cache(async (username: string): Promise<ProfileRow | null> => {
  if (!/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/.test(username)) {
    return null;
  }
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
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

const loadPublicUpdates = cache(
  async (creatorId: string): Promise<CreatorUpdateRow[]> => {
    try {
      return await getPublishedUpdatesForCreator(creatorId);
    } catch {
      return [];
    }
  },
);

const loadSupport = cache(
  async (creatorId: string): Promise<CreatorSupport> => {
    try {
      return await getCreatorSupport(creatorId);
    } catch {
      return { recent: [], totalCount: 0, byGoal: {} };
    }
  },
);

const joinedFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

/** Format a stored handicap for display: negatives are "plus" handicaps. */
function formatHandicap(handicap: number): string {
  return handicap < 0 ? `+${Math.abs(handicap)}` : `${handicap}`;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.5 5.6a4.9 4.9 0 0 1-1.2-3.2h-3v13.1a2.5 2.5 0 1 1-2-2.5V9.9a5.6 5.6 0 1 0 5 5.6V9a7.9 7.9 0 0 0 4.2 1.2V7.2a4.9 4.9 0 0 1-3-1.6z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="currentColor" />
    </svg>
  );
}

function SocialLinks({ profile }: { profile: ProfileRow }) {
  const links = [
    { url: profile.social_youtube, label: "YouTube", Icon: YoutubeIcon },
    { url: profile.social_instagram, label: "Instagram", Icon: InstagramIcon },
    { url: profile.social_tiktok, label: "TikTok", Icon: TikTokIcon },
    { url: profile.social_website, label: "Website", Icon: Globe },
  ].filter((link): link is { url: string; label: string; Icon: typeof Globe } =>
    Boolean(link.url),
  );
  if (links.length === 0) {
    return null;
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone text-ink/70 transition-colors hover:border-forest hover:text-forest"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

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
  const updates = await loadPublicUpdates(profile.id);
  const support = await loadSupport(profile.id);
  const joined = profile.created_at
    ? joinedFormat.format(new Date(profile.created_at))
    : null;

  const meta = [
    profile.handicap != null ? `${formatHandicap(profile.handicap)} handicap` : null,
    profile.location,
    profile.home_club,
    profile.handedness ? `${profile.handedness === "left" ? "Left" : "Right"}-handed` : null,
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6 sm:pb-24">
      {/* Cover hero */}
      <div className="-mx-4 sm:mx-0 sm:mt-8">
        {profile.cover_image_url ? (
          <div className="aspect-[3/1] w-full overflow-hidden bg-mist sm:rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[3/1] w-full bg-gradient-to-br from-forest to-forest-dark sm:rounded-3xl" />
        )}
      </div>

      {/* Identity */}
      <header className="px-1 sm:px-0">
        <div className="-mt-10 sm:-mt-12">
          <div className="inline-flex rounded-full ring-4 ring-white">
            <Avatar src={profile.avatar_url} name={name} size="lg" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium uppercase tracking-wide text-gold-deep">
          Support the journey
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
          {name}
        </h1>
        {meta.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/70">
            {meta.map((item, index) => (
              <span key={item} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-ink/30">
                    ·
                  </span>
                ) : null}
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {profile.bio ? (
          <p className="mt-3 text-base leading-relaxed text-ink/70">
            {profile.bio}
          </p>
        ) : null}
        <SocialLinks profile={profile} />
      </header>

      <div className="mt-5">
        <CreatorStats
          supporters={support.totalCount}
          goalsReached={goals.completed.length}
          updates={updates.length}
          joined={joined}
        />
      </div>

      {profile.about ? (
        <section aria-label={`About ${name}`} className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-forest">About</h2>
          <div className="mt-3">
            <Markdown source={profile.about} />
          </div>
        </section>
      ) : null}

      {profile.pinned_media_url ? (
        <div className="mt-8">
          <PinnedMedia url={profile.pinned_media_url} />
        </div>
      ) : null}

      <div className="mt-8">
        <PublicGoals
          active={goals.active}
          completed={goals.completed}
          creatorName={name}
          isOwner={isOwner}
          supportersByGoal={support.byGoal}
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

      <div className="mt-10">
        <RecentSupport items={support.recent} />
      </div>

      <div className="mt-10">
        <PublicUpdates
          updates={updates}
          creatorName={name}
          isOwner={isOwner}
        />
      </div>
    </main>
  );
}
