import type { Metadata } from "next";

import { ActivityFeed } from "@/components/discover/activity-feed";
import { CategoryGrid } from "@/components/discover/category-grid";
import { CreatorCardView } from "@/components/discover/creator-card-view";
import { DiscoverBrowser } from "@/components/discover/discover-browser";
import { DiscoverHero } from "@/components/discover/discover-hero";
import { DiscoverProvider } from "@/components/discover/discover-context";
import {
  DiscoverRow,
  DiscoverSlide,
} from "@/components/discover/discover-row";
import { GoalCardView } from "@/components/discover/goal-card-view";
import { CallToAction } from "@/components/call-to-action";
import { getDiscoverData } from "@/lib/discover/data";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Discover",
  description:
    "Discover golfers, creators, charities and projects worth supporting. Browse featured journeys, categories and goals — and back the ones that matter to you.",
  path: "/discover",
});

// Public data changes as creators join; refresh periodically without going fully dynamic.
export const revalidate = 300;

export default async function DiscoverPage() {
  const data = await getDiscoverData();

  return (
    <DiscoverProvider>
      <DiscoverHero />

      <DiscoverRow
        eyebrow="Featured creators"
        heading="Golfers worth following"
        intro="The people behind the journeys — from aspiring pros to coaches, charities and creators."
        preview={data.featuredCreators.preview}
        background="white"
      >
        {data.featuredCreators.items.map((creator) => (
          <DiscoverSlide key={creator.key}>
            <CreatorCardView creator={creator} />
          </DiscoverSlide>
        ))}
      </DiscoverRow>

      <DiscoverRow
        eyebrow="Featured goals"
        heading="Back a mission, not just a name"
        intro="People back missions. These are the goals supporters can get behind right now."
        preview={data.featuredGoals.preview}
        layout="grid"
        background="mist"
      >
        {data.featuredGoals.items.map((goal) => (
          <GoalCardView key={goal.key} goal={goal} />
        ))}
      </DiscoverRow>

      <CategoryGrid />

      <DiscoverRow
        eyebrow="Trending"
        heading="Gaining momentum"
        intro="Journeys picking up support right now."
        preview={data.trending.preview}
        previewNote="Concept ranking — a support-velocity signal will power this in a future update."
        background="mist"
      >
        {data.trending.items.map((goal) => (
          <DiscoverSlide key={goal.key}>
            <GoalCardView goal={goal} />
          </DiscoverSlide>
        ))}
      </DiscoverRow>

      <DiscoverRow
        eyebrow="Near completion"
        heading="Help them cross the line"
        intro="Goals between 80% and 95% funded — a little support finishes the job."
        preview={data.nearCompletion.preview}
        background="white"
      >
        {data.nearCompletion.items.map((goal) => (
          <DiscoverSlide key={goal.key}>
            <GoalCardView goal={goal} />
          </DiscoverSlide>
        ))}
      </DiscoverRow>

      <DiscoverRow
        eyebrow="Recently updated"
        heading="Fresh from the journey"
        intro="Creators who just shared an update — the platform stays alive with progress."
        preview={data.recentlyUpdated.preview}
        background="mist"
      >
        {data.recentlyUpdated.items.map((creator) => (
          <DiscoverSlide key={creator.key}>
            <CreatorCardView creator={creator} />
          </DiscoverSlide>
        ))}
      </DiscoverRow>

      <DiscoverRow
        eyebrow="New creators"
        heading="Just getting started"
        intro="Recently joined golfers who could use a first supporter."
        preview={data.newCreators.preview}
        background="white"
      >
        {data.newCreators.items.map((creator) => (
          <DiscoverSlide key={creator.key}>
            <CreatorCardView creator={creator} />
          </DiscoverSlide>
        ))}
      </DiscoverRow>

      <ActivityFeed />

      <DiscoverBrowser goals={data.allGoals} />

      <CallToAction
        heading="Start your own journey"
        body="Set a goal, share your page and let golf fans back the journey with you."
      />
    </DiscoverProvider>
  );
}
