import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { JourneyManager } from "@/components/journey/journey-manager";
import { getOwnProfile } from "@/lib/profile/profile";
import { siteConfig } from "@/lib/site";
import { getOwnPosts } from "@/lib/journey/posts";
import type { JourneyPostRow } from "@/lib/journey/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

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
    title: t("meta.updates.title"),
    description: t("meta.updates.description"),
    robots: { index: false, follow: false },
  };
}

export default async function JourneyPage({
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
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/dashboard/journey`)}`,
      locale: locale as AppLocale,
    });
  }

  let posts: JourneyPostRow[] = [];
  let unavailable = false;
  try {
    posts = await getOwnPosts(user.id);
  } catch {
    unavailable = true;
  }

  let pageUrl: string | undefined;
  try {
    const profile = await getOwnProfile(user.id);
    pageUrl = profile?.username
      ? `${siteConfig.url.replace(/\/$/, "")}/t/${profile.username}`
      : undefined;
  } catch {
    pageUrl = undefined;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("updates.page.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {t("updates.page.intro")}
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            {t("updates.page.unavailable")}
          </div>
        ) : (
          <JourneyManager initialPosts={posts} pageUrl={pageUrl} />
        )}
      </div>
    </main>
  );
}
