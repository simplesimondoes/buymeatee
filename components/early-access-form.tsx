"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import {
  validateEarlyAccessSubmission,
  type EarlyAccessRole,
  type FieldName,
} from "@/lib/early-access/schema";

type FormStatus = "idle" | "submitting" | "success" | "error" | "unavailable";

type FieldErrors = Partial<Record<FieldName, string>>;

const roleOptions: { value: EarlyAccessRole; label: string; hint: string }[] = [
  {
    value: "creator",
    label: "I'm a golf creator",
    hint: "I want to share my journey and goals.",
  },
  {
    value: "supporter",
    label: "I'm a supporter",
    hint: "I want to back the golfers I follow.",
  },
];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-800">
      <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-forest";

export function EarlyAccessForm() {
  const [role, setRole] = useState<EarlyAccessRole>("creator");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const opened = useRef(false);

  function markOpened() {
    if (!opened.current) {
      opened.current = true;
      trackEvent("early_access_form_opened");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      role,
      name: formData.get("name"),
      email: formData.get("email"),
      country: formData.get("country"),
      profileLink: formData.get("profileLink"),
      useCase: formData.get("useCase"),
      consent: formData.get("consent") === "on",
      website: formData.get("website"),
    };

    const result = validateEarlyAccessSubmission(payload);
    if (!result.ok) {
      setErrors(result.errors);
      setStatus("idle");
      return;
    }

    setErrors({});
    setStatus("submitting");
    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, website: payload.website }),
      });
      if (response.ok) {
        trackEvent("early_access_form_submitted", { role });
        setStatus("success");
        form.reset();
        return;
      }
      if (response.status === 503) {
        setStatus("unavailable");
        return;
      }
      if (response.status === 400) {
        const body = (await response.json()) as { errors?: FieldErrors };
        setErrors(body.errors ?? {});
        setStatus("idle");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-3xl border border-forest/20 bg-white p-8 text-center"
      >
        <CircleCheck
          aria-hidden="true"
          className="mx-auto h-10 w-10 text-forest"
        />
        <h3 className="mt-4 font-serif text-2xl font-semibold text-forest">
          You&apos;re on the list.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          Thanks for joining early access. We&apos;ll only use your details to
          keep you posted on BuyMeATee — no noise, just the journey.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Role selection */}
      <fieldset>
        <legend className="text-sm font-medium text-forest">
          How would you use BuyMeATee?
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {roleOptions.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                role === option.value
                  ? "border-forest bg-forest text-white"
                  : "border-stone bg-white text-ink hover:border-forest/40"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => {
                  markOpened();
                  setRole(option.value);
                }}
                className="sr-only"
              />
              <span className="block font-medium">{option.label}</span>
              <span
                className={`mt-0.5 block text-sm ${
                  role === option.value ? "text-white/75" : "text-ink/70"
                }`}
              >
                {option.hint}
              </span>
            </label>
          ))}
        </div>
        <FieldError id="role-error" message={errors.role} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ea-name" className="text-sm font-medium text-forest">
            Name
          </label>
          <input
            id="ea-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            onFocus={markOpened}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={inputClasses}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="ea-email" className="text-sm font-medium text-forest">
            Email
          </label>
          <input
            id="ea-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            onFocus={markOpened}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={inputClasses}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="ea-country" className="text-sm font-medium text-forest">
          Country
        </label>
        <input
          id="ea-country"
          name="country"
          type="text"
          autoComplete="country-name"
          required
          onFocus={markOpened}
          aria-invalid={Boolean(errors.country)}
          aria-describedby={errors.country ? "country-error" : undefined}
          className={inputClasses}
        />
        <FieldError id="country-error" message={errors.country} />
      </div>

      <div>
        <label htmlFor="ea-link" className="text-sm font-medium text-forest">
          Creator profile or social link{" "}
          <span className="font-normal text-ink/70">(optional)</span>
        </label>
        <input
          id="ea-link"
          name="profileLink"
          type="url"
          inputMode="url"
          placeholder="https://"
          onFocus={markOpened}
          aria-invalid={Boolean(errors.profileLink)}
          aria-describedby={errors.profileLink ? "link-error" : undefined}
          className={inputClasses}
        />
        <FieldError id="link-error" message={errors.profileLink} />
      </div>

      <div>
        <label htmlFor="ea-usecase" className="text-sm font-medium text-forest">
          What would you use BuyMeATee for?{" "}
          <span className="font-normal text-ink/70">(optional)</span>
        </label>
        <textarea
          id="ea-usecase"
          name="useCase"
          rows={3}
          onFocus={markOpened}
          aria-invalid={Boolean(errors.useCase)}
          aria-describedby={errors.useCase ? "usecase-error" : undefined}
          className={inputClasses}
        />
        <FieldError id="usecase-error" message={errors.useCase} />
      </div>

      {/* Honeypot — hidden from real users, catches naive bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="ea-website">Website</label>
        <input
          id="ea-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-ink/75">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[--color-forest]"
          />
          <span>
            I&apos;m happy for BuyMeATee to store these details and contact me
            about early access. See the{" "}
            <Link href="/privacy" className="underline hover:text-forest">
              privacy policy
            </Link>
            .
          </span>
        </label>
        <FieldError id="consent-error" message={errors.consent} />
      </div>

      {status === "unavailable" ? (
        <div role="alert" className="rounded-2xl bg-stone/40 p-4 text-sm text-ink/80">
          Honest answer: our sign-up service isn&apos;t connected yet, so
          nothing was saved. We&apos;re getting it ready — please check back
          soon.
        </div>
      ) : null}

      {status === "error" ? (
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-900">
          Something went wrong on our side and your details were not saved.
          Please try again in a little while.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-7 text-base font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="h-5 w-5 animate-spin"
            />
            Sending…
          </>
        ) : (
          "Join early access"
        )}
      </button>
    </form>
  );
}
