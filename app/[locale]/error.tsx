"use client";

import { useTranslations } from "next-intl";

/**
 * Locale-tree error boundary. Its strings live in the `common` namespace,
 * which the root layout always serializes to the client, so translations
 * are available even when a page crashes.
 */
export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-forest">
          {t("errorBoundary.heading")}
        </h1>
        <p className="mt-4 text-lg text-ink/70">{t("errorBoundary.body")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-7 text-base font-medium text-white transition-colors hover:bg-forest-dark"
        >
          {t("errorBoundary.retry")}
        </button>
      </div>
    </section>
  );
}
