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
import { StickySupportBar } from "@/components/profile/sticky-support-bar";
import { SupportHero } from "@/components/profile/support-hero";
import { PublicUpdates } from "@/components/updates/public-updates";
import { CreatorStats } from "@/components/support/creator-stats";
import { RecentSupport } from "@/components/support/recent-support";
import { getPublicGoalsForCreator, type PublicGoals as PublicGoalsData } from "@/lib/goals/public";
import { getPublishedUpdatesForCreator } from "@/lib/updates/public";
import type { CreatorUpdateRow } from "@/lib/updates/types";
import { getCreatorSupport, type CreatorSupport } from "@/lib/support/public";
import { canonicalUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";
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
  social_x: string | null;
  social_bluesky: string | null;
  social_substack: string | null;
  social_facebook: string | null;
  social_twitch: string | null;
  social_linkedin: string | null;
  social_website: string | null;
  pinned_media_url: string | null;
  created_at: string | null;
  deactivated_at: string | null;
};

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, cover_image_url, bio, about, handicap, location, home_club, handedness, social_youtube, social_instagram, social_tiktok, social_x, social_bluesky, social_substack, social_facebook, social_twitch, social_linkedin, social_website, pinned_media_url, created_at, deactivated_at";

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

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.254 2.25h6.83l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 10.8C10.9 8.6 7.9 4.5 5.1 2.6 2.4.8 1.4 1.1.7 1.4 0 1.7 0 2.9 0 3.6c0 .7.4 5.5.6 6.3.8 2.6 3.5 3.5 6 3.2-3.7.5-7 1.9-2.7 6.7 4.8 4.9 6.6-1 7.5-3.9.9 2.9 2 8.6 7.4 3.9 4-3.9.8-6.2-2.9-6.7 2.5.3 5.2-.6 6-3.2.2-.8.6-5.6.6-6.3 0-.7 0-1.9-.7-2.2-.7-.3-1.7-.6-4.4 1.2C16.1 4.5 13.1 8.6 12 10.8z" />
    </svg>
  );
}

function SubstackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4 3.6h16v2.6H4zM4 8.7h16v2.6H4zM4 13.8v6.6l8-3.5 8 3.5v-6.6z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4.3 3 3 6.4v13.1h4.5V22h2.5l2.5-2.5h3.6L21 14.6V3zm14.4 10.7-2.5 2.5h-3.6L10.5 18v-1.8H6.9V4.4h11.8z" />
      <path d="M15.6 7.4h-1.5v4.2h1.5zm-4 0h-1.5v4.2h1.5z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.4 3H3.6C3 3 2.5 3.5 2.5 4.1v15.8c0 .6.5 1.1 1.1 1.1h16.8c.6 0 1.1-.5 1.1-1.1V4.1c0-.6-.5-1.1-1.1-1.1zM8.3 18.3H5.5V9.5h2.8zM6.9 8.3a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm11.4 10h-2.8v-4.3c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.3v4.3H9.7V9.5h2.7v1.2h.04c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.3z" />
    </svg>
  );
}

type SocialLink = {
  url: string;
  label: string;
  Icon: typeof Globe;
  /** Brand-coloured badge background (see social tokens in globals.css). */
  badge: string;
};

function SocialLinks({ profile }: { profile: ProfileRow }) {
  const links = [
    { url: profile.social_youtube, label: "YouTube", Icon: YoutubeIcon, badge: "bg-youtube" },
    { url: profile.social_instagram, label: "Instagram", Icon: InstagramIcon, badge: "bg-instagram" },
    { url: profile.social_tiktok, label: "TikTok", Icon: TikTokIcon, badge: "bg-tiktok" },
    { url: profile.social_x, label: "X", Icon: XIcon, badge: "bg-x" },
    { url: profile.social_bluesky, label: "Bluesky", Icon: BlueskyIcon, badge: "bg-bluesky" },
    { url: profile.social_substack, label: "Substack", Icon: SubstackIcon, badge: "bg-substack" },
    { url: profile.social_facebook, label: "Facebook", Icon: FacebookIcon, badge: "bg-facebook" },
    { url: profile.social_twitch, label: "Twitch", Icon: TwitchIcon, badge: "bg-twitch" },
    { url: profile.social_linkedin, label: "LinkedIn", Icon: LinkedinIcon, badge: "bg-linkedin" },
    { url: profile.social_website, label: "Website", Icon: Globe, badge: "bg-forest" },
  ].filter((link): link is SocialLink => Boolean(link.url));
  if (links.length === 0) {
    return null;
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      {links.map(({ url, label, Icon, badge }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={label}
          title={label}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${badge}`}
        >
          <Icon className="h-[18px] w-[18px]" />
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
  const title = `Buy ${name} a Tee`;
  const description =
    goals.active.length > 0
      ? `Support ${name}'s golf journey with a Tee — back a real goal and watch it happen.`
      : `Support ${name}'s golf journey with a Tee.`;
  const url = canonicalUrl(`/t/${username.toLowerCase()}`);
  // Shareable card generated per-creator by ./opengraph-image.tsx.
  const image = {
    url: canonicalUrl(`/t/${username.toLowerCase()}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: `Support ${name} on BuyMeATee`,
  };
  return {
    title,
    description,
    // Profile pages stay noindex by design (ADR-016): out of search, while
    // social unfurls (the point of sharing) still work.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "profile",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
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
      {/* Cover hero — a tall, full-bleed image on phones (where most
          supporters land) that the content card rises over; a wide banner on
          larger screens. */}
      <div className="-mx-4 sm:mx-0 sm:mt-8">
        {profile.cover_image_url ? (
          <div className="aspect-[3/2] w-full overflow-hidden bg-mist sm:aspect-[3/1] sm:rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[3/2] w-full bg-gradient-to-br from-forest to-forest-dark sm:aspect-[3/1] sm:rounded-3xl" />
        )}
      </div>

      {/* Identity — on mobile this is a white card with a rounded top that
          overlaps the cover for depth; on larger screens it's a plain column. */}
      <header className="relative z-10 -mx-4 -mt-8 rounded-t-3xl bg-white px-4 shadow-[0_-16px_32px_-24px_rgba(7,62,46,0.35)] sm:mx-0 sm:mt-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:shadow-none">
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
        <SupportHero name={name} goal={goals.active[0] ?? null} ready={ready} />
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

      <div id="support" className="mt-8 scroll-mt-6">
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

      {ready ? <StickySupportBar name={name} /> : null}
    </main>
  );
}
