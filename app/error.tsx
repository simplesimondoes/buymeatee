"use client";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-offwhite">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-forest">
          Something went wrong.
        </h1>
        <p className="mt-4 text-lg text-ink/70">
          An unexpected error interrupted the round. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-7 text-base font-medium text-cream transition-colors hover:bg-forest-dark"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
