import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { UpdateManager } from "@/components/updates/update-manager";
import { getOwnUpdates } from "@/lib/updates/updates";
import type { CreatorUpdateRow } from "@/lib/updates/types";
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

export default async function UpdatesPage({
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
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/dashboard/updates`)}`,
      locale: locale as AppLocale,
    });
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
          <UpdateManager initialUpdates={updates} />
        )}
      </div>
    </main>
  );
}
