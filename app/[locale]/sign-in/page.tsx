import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignInForm } from "@/components/auth/sign-in-form";
import { ClientMessages } from "@/components/intl/client-messages";
import { safeRelativePath } from "@/lib/auth/safe-path";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "auth",
  });
  return {
    title: t("signIn.title"),
    description: t("signIn.intro"),
    robots: { index: false, follow: false },
  };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);

  const query = await searchParams;
  const next = safeRelativePath(query.next, `/${locale}/dashboard`);

  const user = await getAuthenticatedUser();
  if (user) {
    redirect(next);
  }

  const t = await getTranslations({ locale: locale as AppLocale, namespace: "auth" });

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-serif text-3xl font-semibold text-forest sm:text-4xl">
        {t("signIn.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {t("signIn.intro")}
      </p>
      <div className="mt-8">
        <ClientMessages namespaces={["auth"]}>
          <SignInForm next={next} initialError={query.error} />
        </ClientMessages>
      </div>
    </main>
  );
}
