"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FormStatus = "idle" | "submitting" | "sent" | "error" | "unavailable";

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-forest";

export function SignInForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [email, setEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("unavailable");
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="rounded-3xl border border-forest/20 bg-white p-8 text-center"
      >
        <CircleCheck aria-hidden="true" className="mx-auto h-10 w-10 text-forest" />
        <h2 className="mt-4 font-serif text-2xl font-semibold text-forest">
          {t("signIn.sentHeading")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          {t.rich("signIn.sentBody", {
            email,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {initialError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-900"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {initialError === "link-invalid"
            ? t("signIn.errorLinkInvalid")
            : t("signIn.errorUnavailable")}
        </div>
      ) : null}

      <div>
        <label htmlFor="signin-email" className="text-sm font-medium text-forest">
          {t("signIn.emailLabel")}
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClasses}
        />
      </div>

      {status === "unavailable" ? (
        <div role="alert" className="rounded-2xl bg-stone/40 p-4 text-sm text-ink/80">
          {t("signIn.notConfigured")}
        </div>
      ) : null}

      {status === "error" ? (
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-900">
          {t("signIn.sendFailed")}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-7 text-base font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
            {t("signIn.submitting")}
          </>
        ) : (
          t("signIn.submit")
        )}
      </button>
    </form>
  );
}
