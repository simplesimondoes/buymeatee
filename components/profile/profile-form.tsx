"use client";

import { Check, Copy, LoaderCircle, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

import {
  BIO_MAX_LENGTH,
  validateProfileInput,
  type ProfileFieldName,
} from "@/lib/profile/profile-schema";

type FieldErrors = Partial<Record<ProfileFieldName, string>>;

interface ProfileFormProps {
  initialUsername: string | null;
  initialDisplayName: string;
  initialBio: string;
  initialCountry: string;
}

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 aria-[invalid=true]:border-red-700";

const labelClasses = "block text-sm font-medium text-ink/80";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="mt-1.5 text-sm text-red-800">
      {message}
    </p>
  );
}

/**
 * Edits the signed-in user's profile. Client-side validation mirrors the
 * server exactly (shared schema module); the server response is authoritative
 * — including username uniqueness, which only the database can decide.
 */
export function ProfileForm({
  initialUsername,
  initialDisplayName,
  initialBio,
  initialCountry,
}: ProfileFormProps) {
  const fieldId = useId();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [country, setCountry] = useState(initialCountry);
  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const usernameChanged =
    savedUsername !== null && username.trim().toLowerCase() !== savedUsername;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setFormError(null);

    const payload = { username, displayName, bio, country };
    const validation = validateProfileInput(payload);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const body = (await response.json().catch(() => ({}))) as {
        profile?: { username: string | null };
        errors?: FieldErrors;
        error?: string;
      };
      if (response.ok && body.profile) {
        setSavedUsername(body.profile.username);
        setUsername(body.profile.username ?? "");
        setSaved(true);
      } else if (body.errors) {
        setErrors(body.errors);
      } else {
        setFormError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  async function copyLink() {
    if (!savedUsername) {
      return;
    }
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/t/${savedUsername}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/older browser): the visible URL
      // below remains selectable by hand.
    }
  }

  function errorProps(field: ProfileFieldName) {
    const message = errors[field];
    return {
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${fieldId}-${field}-error` : undefined,
    } as const;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor={`${fieldId}-username`} className={labelClasses}>
          Your public link
        </label>
        <div className="mt-1.5 flex items-center rounded-xl border border-stone bg-white focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
          <span className="pl-4 text-sm text-ink/50" aria-hidden="true">
            buymeatee.com/t/
          </span>
          <input
            id={`${fieldId}-username`}
            name="username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="your-name"
            className="w-full min-w-0 rounded-r-xl border-0 bg-transparent py-2.5 pl-0.5 pr-4 text-base text-ink placeholder:text-ink/40 focus:outline-none focus:ring-0"
            {...errorProps("username")}
          />
        </div>
        <FieldError id={`${fieldId}-username-error`} message={errors.username} />
        {usernameChanged ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-amber-800">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            Saving changes your public link. Anywhere you shared
            buymeatee.com/t/{savedUsername} will stop working.
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-ink/60">
            Lowercase letters, numbers and hyphens. This is the link supporters
            visit to buy you a tee.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${fieldId}-displayName`} className={labelClasses}>
          Display name
        </label>
        <input
          id={`${fieldId}-displayName`}
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={inputClasses}
          {...errorProps("displayName")}
        />
        <FieldError id={`${fieldId}-displayName-error`} message={errors.displayName} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${fieldId}-bio`} className={labelClasses}>
            Bio <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              bio.length > BIO_MAX_LENGTH ? "text-red-800" : "text-ink/50"
            }`}
            aria-live="polite"
          >
            {bio.length}/{BIO_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={`${fieldId}-bio`}
          name="bio"
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Where your golf journey is heading, and what support helps you do."
          className={inputClasses}
          {...errorProps("bio")}
        />
        <FieldError id={`${fieldId}-bio-error`} message={errors.bio} />
      </div>

      <div>
        <label htmlFor={`${fieldId}-country`} className={labelClasses}>
          Country <span className="font-normal text-ink/50">(optional)</span>
        </label>
        <input
          id={`${fieldId}-country`}
          name="country"
          type="text"
          autoComplete="country-name"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className={inputClasses}
          {...errorProps("country")}
        />
        <FieldError id={`${fieldId}-country-error`} message={errors.country} />
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70"
        >
          {saving ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : null}
          Save profile
        </button>

        {formError ? (
          <p role="alert" className="text-sm text-red-800">
            {formError}
          </p>
        ) : null}

        {saved && savedUsername ? (
          <div
            role="status"
            className="rounded-2xl border border-forest/25 bg-forest/5 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-forest">
              <Check aria-hidden="true" className="h-4 w-4" />
              Profile saved. Your page is live at:
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={`/t/${savedUsername}`}
                className="text-sm font-medium text-forest underline underline-offset-2"
              >
                buymeatee.com/t/{savedUsername}
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-forest/30 px-3 text-xs font-medium text-forest hover:border-forest hover:bg-forest/5"
              >
                {copied ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}
