import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ActivityFeed } from "@/components/discover/activity-feed";
import { CategoryGrid } from "@/components/discover/category-grid";
import { DiscoverBrowser } from "@/components/discover/discover-browser";
import { DiscoverHero } from "@/components/discover/discover-hero";
import { DiscoverProvider } from "@/components/discover/discover-context";
import {
  DiscoverRow,
  DiscoverSlide,
} from "@/components/discover/discover-row";
import { GoalCardView } from "@/components/discover/goal-card-view";
import { CallToAction } from "@/components/call-to-action";
import { ClientMessages } from "@/components/intl/client-messages";
import { getDiscoverData } from "@/lib/discover/data";
import { pageMetadata } from "@/lib/seo/metadata";
import type { AppLocale } from "@/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "discover",
  });
  return pageMetadata({
    title: t("meta.title"),
    description: t("meta.description"),
    path: "/discover",
    locale: locale as AppLocale,
  });
}

// Public data changes as creators join; refresh periodically without going fully dynamic.
export const revalidate = 300;

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "discover",
  });
  const data = await getDiscoverData();

  return (
    // "content" ships too: Preview creator/activity strings are keys in the
    // content namespace, resolved inside the client card islands.
    <ClientMessages namespaces={["discover", "content", "marketing"]}>
      <DiscoverProvider>
        <DiscoverHero />

        <DiscoverRow
          eyebrow={t("sections.featuredGoals.eyebrow")}
          heading={t("sections.featuredGoals.heading")}
          intro={t("sections.featuredGoals.intro")}
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
          eyebrow={t("sections.trending.eyebrow")}
          heading={t("sections.trending.heading")}
          intro={t("sections.trending.intro")}
          preview={data.trending.preview}
          previewNote={t("sections.trending.previewNote")}
          background="mist"
        >
          {data.trending.items.map((goal) => (
            <DiscoverSlide key={goal.key}>
              <GoalCardView goal={goal} />
            </DiscoverSlide>
          ))}
        </DiscoverRow>

        <DiscoverRow
          eyebrow={t("sections.nearCompletion.eyebrow")}
          heading={t("sections.nearCompletion.heading")}
          intro={t("sections.nearCompletion.intro")}
          preview={data.nearCompletion.preview}
          background="white"
        >
          {data.nearCompletion.items.map((goal) => (
            <DiscoverSlide key={goal.key}>
              <GoalCardView goal={goal} />
            </DiscoverSlide>
          ))}
        </DiscoverRow>

        <ActivityFeed />

        <DiscoverBrowser goals={data.allGoals} />

        <CallToAction heading={t("cta.heading")} body={t("cta.body")} />
      </DiscoverProvider>
    </ClientMessages>
  );
}
