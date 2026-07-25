import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@/components/intl/client-messages";
import { SettingsNav } from "@/components/settings-nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  // One client-message boundary for the whole settings area: the nav and
  // every client island beneath the pages read "settings" (+ "errors" for
  // useErrorMessage; "common" is always included).
  return (
    <ClientMessages namespaces={["settings", "errors"]}>
      <SettingsNav />
      {children}
    </ClientMessages>
  );
}
