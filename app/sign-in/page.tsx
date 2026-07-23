import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { safeRelativePath } from "@/lib/auth/safe-path";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to BuyMeATee with an email link.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeRelativePath(params.next);

  const user = await getAuthenticatedUser();
  if (user) {
    redirect(next);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Sign in
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        No passwords here — we&apos;ll email you a one-time sign-in link.
      </p>
      <div className="mt-8">
        <SignInForm next={next} initialError={params.error} />
      </div>
    </main>
  );
}
