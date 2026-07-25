import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";

import { searchProfiles } from "@/lib/admin/users";
import { formatDate } from "@/lib/i18n/format";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

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
    title: t("meta.users.title"),
    robots: { index: false, follow: false },
  };
}

/**
 * Platform user admin: search profiles, see status at a glance, open the
 * per-user operational view. Server-checked admin access — non-admins get
 * the same 404 as /admin/payments.
 */
export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  setRequestLocale(appLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/admin/users`)}`,
      locale: appLocale,
    });
  }
  if (!(await isAdmin(user.id))) {
    notFound();
  }

  const t = await getTranslations({ locale: appLocale, namespace: "admin" });

  const { q } = await searchParams;
  let profiles: Awaited<ReturnType<typeof searchProfiles>> = [];
  let unavailable = false;
  try {
    profiles = await searchProfiles(q);
  } catch {
    unavailable = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {t("common.eyebrow")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest">
        {t("users.title")}
      </h1>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <label htmlFor="admin-user-search" className="sr-only">
          {t("users.searchLabel")}
        </label>
        <input
          id="admin-user-search"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder={t("users.searchPlaceholder")}
          className="w-full max-w-md rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
        >
          {t("common.search")}
        </button>
      </form>

      {unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          {t("users.unavailable")}
        </div>
      ) : profiles.length === 0 ? (
        <p className="mt-8 text-sm text-ink/70">{t("users.empty")}</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-stone">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone bg-mist text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th scope="col" className="px-4 py-3">{t("users.table.profile")}</th>
                <th scope="col" className="px-4 py-3">{t("users.table.publicLink")}</th>
                <th scope="col" className="px-4 py-3">{t("users.table.role")}</th>
                <th scope="col" className="px-4 py-3">{t("users.table.status")}</th>
                <th scope="col" className="px-4 py-3">{t("users.table.joined")}</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-stone/60 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${profile.id}`}
                      className="font-medium text-forest underline underline-offset-2"
                    >
                      {profile.display_name || t("common.noName")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/75">
                    {profile.username ? `/t/${profile.username}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink/75">
                    {t(`statuses.role.${profile.role}`)}
                  </td>
                  <td className="px-4 py-3">
                    {profile.deactivated_at ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        {t("statuses.account.deactivated")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                        {t("statuses.account.active")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {formatDate(profile.created_at, appLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
