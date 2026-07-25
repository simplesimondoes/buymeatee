import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { AdminNav } from "@/components/admin/admin-nav";
import { ClientMessages } from "@/components/intl/client-messages";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  // The Analytics tab is owner-only (analytics-access.ts); hiding it here is
  // presentation — the page re-checks server-side and 404s everyone else.
  let showAnalytics = false;
  try {
    const user = await getAuthenticatedUser();
    showAnalytics = canViewAnalytics(user?.email);
  } catch {
    showAnalytics = false;
  }

  return (
    <ClientMessages namespaces={["admin", "errors"]}>
      <AdminNav showAnalytics={showAnalytics} />
      {children}
    </ClientMessages>
  );
}
