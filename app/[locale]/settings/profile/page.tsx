import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { CoverUploader } from "@/components/profile/cover-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { getOwnProfile, type OwnProfile } from "@/lib/profile/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "settings",
  });
  return {
    title: t("meta.profile.title"),
    description: t("meta.profile.description"),
    robots: { index: false, follow: false },
  };
}

export default async function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "settings",
  });

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/settings/profile`)}`,
      locale: locale as AppLocale,
    });
  }

  let profile: OwnProfile | null = null;
  let unavailable = false;
  try {
    profile = await getOwnProfile(user.id);
  } catch {
    unavailable = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("profile.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {t("profile.intro")}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone bg-white px-4 py-3">
        <div>
          <span className="block text-sm font-medium text-ink/80">
            {t("profile.language.label")}
          </span>
          <span className="block text-xs text-ink/70">
            {t("profile.language.help")}
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      {unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          {t("profile.unavailable")}
        </div>
      ) : (
        <div className="mt-8 space-y-8 rounded-3xl border border-stone bg-white p-6 sm:p-8">
          <CoverUploader
            endpoint="/api/profile/cover"
            initialUrl={profile?.cover_image_url ?? null}
            label={t("profile.cover.label")}
            helpText={t("profile.cover.help")}
            addLabel={t("profile.cover.add")}
            changeLabel={t("profile.cover.change")}
            removeLabel={t("profile.cover.remove")}
            invalidTypeMessage={t("profile.cover.errors.type")}
            tooLargeMessage={t("profile.cover.errors.size")}
            aspectClassName="aspect-[3/2]"
          />
          <AvatarUploader
            initialAvatarUrl={profile?.avatar_url ?? null}
            displayName={profile?.display_name ?? ""}
          />
          <ProfileForm
            initialUsername={profile?.username ?? null}
            initialDisplayName={profile?.display_name ?? ""}
            initialBio={profile?.bio ?? ""}
            initialAbout={profile?.about ?? ""}
            initialCountry={profile?.country ?? ""}
            initialHandicap={profile?.handicap != null ? String(profile.handicap) : ""}
            initialLocation={profile?.location ?? ""}
            initialHomeClub={profile?.home_club ?? ""}
            initialHandedness={profile?.handedness ?? ""}
            initialSocialYoutube={profile?.social_youtube ?? ""}
            initialSocialInstagram={profile?.social_instagram ?? ""}
            initialSocialTiktok={profile?.social_tiktok ?? ""}
            initialSocialX={profile?.social_x ?? ""}
            initialSocialBluesky={profile?.social_bluesky ?? ""}
            initialSocialSubstack={profile?.social_substack ?? ""}
            initialSocialFacebook={profile?.social_facebook ?? ""}
            initialSocialTwitch={profile?.social_twitch ?? ""}
            initialSocialLinkedin={profile?.social_linkedin ?? ""}
            initialSocialWebsite={profile?.social_website ?? ""}
            initialPinnedMediaUrl={profile?.pinned_media_url ?? ""}
          />
        </div>
      )}
    </main>
  );
}
