import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { DashboardNav } from "@/components/dashboard-nav";
import { ClientMessages } from "@/components/intl/client-messages";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  return (
    // Every dashboard page renders client managers, so the layout provides
    // the dashboard + errors namespaces once for all of them (and the nav).
    <ClientMessages namespaces={["dashboard", "gifts", "errors"]}>
      <DashboardNav />
      {children}
    </ClientMessages>
  );
}
