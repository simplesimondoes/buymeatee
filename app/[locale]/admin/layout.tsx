import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { AdminNav } from "@/components/admin/admin-nav";
import { ClientMessages } from "@/components/intl/client-messages";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  return (
    <ClientMessages namespaces={["admin", "errors"]}>
      <AdminNav />
      {children}
    </ClientMessages>
  );
}
