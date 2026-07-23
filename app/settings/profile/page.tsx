import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { getOwnProfile, type OwnProfile } from "@/lib/profile/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile settings",
  description: "Set up your public BuyMeATee page.",
  robots: { index: false, follow: false },
};

export default async function ProfileSettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fsettings%2Fprofile");
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
        Settings
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Profile
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        This is what supporters see on your public page — your link, your name
        and where your journey is heading.
      </p>

      {unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          Profile settings aren&apos;t available right now. Please try again
          shortly.
        </div>
      ) : (
        <div className="mt-8 space-y-8 rounded-3xl border border-stone bg-white p-6 sm:p-8">
          <AvatarUploader
            initialAvatarUrl={profile?.avatar_url ?? null}
            displayName={profile?.display_name ?? ""}
          />
          <ProfileForm
            initialUsername={profile?.username ?? null}
            initialDisplayName={profile?.display_name ?? ""}
            initialBio={profile?.bio ?? ""}
            initialCountry={profile?.country ?? ""}
          />
        </div>
      )}
    </main>
  );
}
