import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { DashboardNav } from "@/components/dashboard-nav";
import { ClientMessages } from "@/components/intl/client-messages";
import { getMerchFlags } from "@/lib/merch/config";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  // The merch tab appears only while the merchandise feature is enabled.
  const showMerch = getMerchFlags().merchEnabled;

  return (
    // Every dashboard page renders client managers, so the layout provides
    // the dashboard + errors namespaces once for all of them (and the nav).
    <ClientMessages namespaces={["dashboard", "gifts", "errors"]}>
      <DashboardNav showMerch={showMerch} />
      {children}
    </ClientMessages>
  );
}
