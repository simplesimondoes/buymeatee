import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { SocialStudio } from "@/components/admin/social/social-studio";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { listDrafts } from "@/lib/social-studio/drafts";
import { isSocialStudioConfigured } from "@/lib/social-studio/generate";
import type { SocialDraftRow } from "@/lib/social-studio/types";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "admin",
  });
  return {
    title: t("meta.social.title"),
    robots: { index: false, follow: false },
  };
}

/**
 * Social Content Studio (ADR-023): the single place BuyMeATee's social
 * content is planned, refined and manually published. Owner-only — same
 * verified-email gate as /admin/analytics; other admins get a plain 404.
 */
export default async function AdminSocialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  setRequestLocale(appLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/admin/social`)}`,
      locale: appLocale,
    });
  }
  if (!canViewAnalytics(user.email)) {
    notFound();
  }

  const t = await getTranslations({ locale: appLocale, namespace: "admin" });

  let drafts: SocialDraftRow[] = [];
  let unavailable = false;
  if (isSupabaseConfigured()) {
    try {
      drafts = await listDrafts();
    } catch {
      unavailable = true;
    }
  } else {
    unavailable = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-forest">
        {t("social.page.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">
        {t("social.page.intro")}
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            {t("social.page.unavailable")}
          </div>
        ) : (
          <SocialStudio
            initialDrafts={drafts}
            aiConfigured={isSocialStudioConfigured()}
          />
        )}
      </div>
    </main>
  );
}
