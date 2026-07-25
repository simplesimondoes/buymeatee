"use client";

import { Check, Copy, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import {
  ABOUT_MAX_LENGTH,
  BIO_MAX_LENGTH,
  validateProfileInput,
  type ProfileFieldError,
  type ProfileFieldName,
} from "@/lib/profile/profile-schema";

type FieldErrors = Partial<Record<ProfileFieldName, ProfileFieldError>>;

interface ProfileFormProps {
  initialUsername: string | null;
  initialDisplayName: string;
  initialBio: string;
  initialAbout: string;
  initialCountry: string;
  initialHandicap: string;
  initialLocation: string;
  initialHomeClub: string;
  initialHandedness: string;
  initialSocialYoutube: string;
  initialSocialInstagram: string;
  initialSocialTiktok: string;
  initialSocialX: string;
  initialSocialBluesky: string;
  initialSocialSubstack: string;
  initialSocialFacebook: string;
  initialSocialTwitch: string;
  initialSocialLinkedin: string;
  initialSocialWebsite: string;
  initialPinnedMediaUrl: string;
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
 * Field errors are stable codes (ADR-019) rendered via useErrorMessage.
 */
export function ProfileForm({
  initialUsername,
  initialDisplayName,
  initialBio,
  initialAbout,
  initialCountry,
  initialHandicap,
  initialLocation,
  initialHomeClub,
  initialHandedness,
  initialSocialYoutube,
  initialSocialInstagram,
  initialSocialTiktok,
  initialSocialX,
  initialSocialBluesky,
  initialSocialSubstack,
  initialSocialFacebook,
  initialSocialTwitch,
  initialSocialLinkedin,
  initialSocialWebsite,
  initialPinnedMediaUrl,
}: ProfileFormProps) {
  const t = useTranslations("settings");
  const errorMessage = useErrorMessage();
  const fieldId = useId();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [about, setAbout] = useState(initialAbout);
  const [country, setCountry] = useState(initialCountry);
  const [handicap, setHandicap] = useState(initialHandicap);
  const [location, setLocation] = useState(initialLocation);
  const [homeClub, setHomeClub] = useState(initialHomeClub);
  const [handedness, setHandedness] = useState(initialHandedness);
  const [socialYoutube, setSocialYoutube] = useState(initialSocialYoutube);
  const [socialInstagram, setSocialInstagram] = useState(initialSocialInstagram);
  const [socialTiktok, setSocialTiktok] = useState(initialSocialTiktok);
  const [socialX, setSocialX] = useState(initialSocialX);
  const [socialBluesky, setSocialBluesky] = useState(initialSocialBluesky);
  const [socialSubstack, setSocialSubstack] = useState(initialSocialSubstack);
  const [socialFacebook, setSocialFacebook] = useState(initialSocialFacebook);
  const [socialTwitch, setSocialTwitch] = useState(initialSocialTwitch);
  const [socialLinkedin, setSocialLinkedin] = useState(initialSocialLinkedin);
  const [socialWebsite, setSocialWebsite] = useState(initialSocialWebsite);
  const [pinnedMediaUrl, setPinnedMediaUrl] = useState(initialPinnedMediaUrl);
  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ErrorDetail | string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const usernameChanged =
    savedUsername !== null && username.trim().toLowerCase() !== savedUsername;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setFormError(null);

    const payload = {
      username,
      displayName,
      bio,
      about,
      country,
      handicap,
      location,
      homeClub,
      handedness,
      socialYoutube,
      socialInstagram,
      socialTiktok,
      socialX,
      socialBluesky,
      socialSubstack,
      socialFacebook,
      socialTwitch,
      socialLinkedin,
      socialWebsite,
      pinnedMediaUrl,
    };
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
        error?: ErrorDetail | string;
      };
      if (response.ok && body.profile) {
        setSavedUsername(body.profile.username);
        setUsername(body.profile.username ?? "");
        setSaved(true);
      } else if (body.errors && Object.keys(body.errors).length > 0) {
        setErrors(body.errors);
      } else {
        setFormError(body.error ?? errorDetail("generic"));
      }
    } catch {
      setFormError(errorDetail("generic"));
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

  function fieldErrorText(field: ProfileFieldName): string | undefined {
    const detail = errors[field];
    return detail === undefined ? undefined : errorMessage(detail);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor={`${fieldId}-username`} className={labelClasses}>
          {t("profile.form.usernameLabel")}
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
            placeholder={t("profile.form.usernamePlaceholder")}
            className="w-full min-w-0 rounded-r-xl border-0 bg-transparent py-2.5 pl-0.5 pr-4 text-base text-ink placeholder:text-ink/40 focus:outline-none focus:ring-0"
            {...errorProps("username")}
          />
        </div>
        <FieldError
          id={`${fieldId}-username-error`}
          message={fieldErrorText("username")}
        />
        {usernameChanged ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-amber-800">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {t("profile.form.usernameChangeWarning", {
              username: savedUsername ?? "",
            })}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-ink/60">
            {t("profile.form.usernameHelp")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${fieldId}-displayName`} className={labelClasses}>
          {t("profile.form.displayNameLabel")}
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
        <FieldError
          id={`${fieldId}-displayName-error`}
          message={fieldErrorText("displayName")}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${fieldId}-bio`} className={labelClasses}>
            {t("profile.form.bioLabel")}{" "}
            <span className="font-normal text-ink/50">
              {t("profile.form.optional")}
            </span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              bio.length > BIO_MAX_LENGTH ? "text-red-800" : "text-ink/50"
            }`}
            aria-live="polite"
          >
            {t("profile.form.charCount", {
              count: String(bio.length),
              max: String(BIO_MAX_LENGTH),
            })}
          </span>
        </div>
        <textarea
          id={`${fieldId}-bio`}
          name="bio"
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder={t("profile.form.bioPlaceholder")}
          className={inputClasses}
          {...errorProps("bio")}
        />
        <FieldError id={`${fieldId}-bio-error`} message={fieldErrorText("bio")} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${fieldId}-about`} className={labelClasses}>
            {t("profile.form.aboutLabel")}{" "}
            <span className="font-normal text-ink/50">
              {t("profile.form.optional")}
            </span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              about.length > ABOUT_MAX_LENGTH ? "text-red-800" : "text-ink/50"
            }`}
            aria-live="polite"
          >
            {t("profile.form.charCount", {
              count: String(about.length),
              max: String(ABOUT_MAX_LENGTH),
            })}
          </span>
        </div>
        <textarea
          id={`${fieldId}-about`}
          name="about"
          rows={7}
          value={about}
          onChange={(event) => setAbout(event.target.value)}
          placeholder={t("profile.form.aboutPlaceholder")}
          className={`${inputClasses} font-mono text-sm`}
          {...errorProps("about")}
        />
        <FieldError id={`${fieldId}-about-error`} message={fieldErrorText("about")} />
        <p className="mt-1.5 text-sm text-ink/60">
          {t.rich("profile.form.aboutHelp", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>

      <div>
        <label htmlFor={`${fieldId}-country`} className={labelClasses}>
          {t("profile.form.countryLabel")}{" "}
          <span className="font-normal text-ink/50">
            {t("profile.form.optional")}
          </span>
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
        <FieldError
          id={`${fieldId}-country-error`}
          message={fieldErrorText("country")}
        />
      </div>

      <fieldset className="space-y-5 border-t border-stone pt-6">
        <legend className="text-sm font-medium text-forest">
          {t("profile.form.golfLegend")}{" "}
          <span className="font-normal text-ink/50">
            {t("profile.form.optional")}
          </span>
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldId}-handicap`} className={labelClasses}>
              {t("profile.form.handicapLabel")}
            </label>
            <input
              id={`${fieldId}-handicap`}
              type="text"
              inputMode="decimal"
              value={handicap}
              onChange={(event) => setHandicap(event.target.value)}
              placeholder={t("profile.form.handicapPlaceholder")}
              className={inputClasses}
              {...errorProps("handicap")}
            />
            <FieldError
              id={`${fieldId}-handicap-error`}
              message={fieldErrorText("handicap")}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-handedness`} className={labelClasses}>
              {t("profile.form.handednessLabel")}
            </label>
            <select
              id={`${fieldId}-handedness`}
              value={handedness}
              onChange={(event) => setHandedness(event.target.value)}
              className={inputClasses}
              {...errorProps("handedness")}
            >
              <option value="">{t("profile.form.handednessNotSet")}</option>
              <option value="right">{t("profile.form.handednessRight")}</option>
              <option value="left">{t("profile.form.handednessLeft")}</option>
            </select>
            <FieldError
              id={`${fieldId}-handedness-error`}
              message={fieldErrorText("handedness")}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${fieldId}-location`} className={labelClasses}>
            {t("profile.form.locationLabel")}
          </label>
          <input
            id={`${fieldId}-location`}
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t("profile.form.locationPlaceholder")}
            className={inputClasses}
            {...errorProps("location")}
          />
          <FieldError
            id={`${fieldId}-location-error`}
            message={fieldErrorText("location")}
          />
        </div>
        <div>
          <label htmlFor={`${fieldId}-homeClub`} className={labelClasses}>
            {t("profile.form.homeClubLabel")}
          </label>
          <input
            id={`${fieldId}-homeClub`}
            type="text"
            value={homeClub}
            onChange={(event) => setHomeClub(event.target.value)}
            placeholder={t("profile.form.homeClubPlaceholder")}
            className={inputClasses}
            {...errorProps("homeClub")}
          />
          <FieldError
            id={`${fieldId}-homeClub-error`}
            message={fieldErrorText("homeClub")}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-stone pt-6">
        <legend className="text-sm font-medium text-forest">
          {t("profile.form.linksLegend")}{" "}
          <span className="font-normal text-ink/50">
            {t("profile.form.optional")}
          </span>
        </legend>
        {(
          [
            // Platform names stay untranslated (brand names).
            ["socialYoutube", "YouTube", t("profile.form.socialPlaceholders.youtube"), setSocialYoutube, socialYoutube],
            ["socialInstagram", "Instagram", t("profile.form.socialPlaceholders.instagram"), setSocialInstagram, socialInstagram],
            ["socialTiktok", "TikTok", t("profile.form.socialPlaceholders.tiktok"), setSocialTiktok, socialTiktok],
            ["socialX", "X", t("profile.form.socialPlaceholders.x"), setSocialX, socialX],
            ["socialBluesky", "Bluesky", t("profile.form.socialPlaceholders.bluesky"), setSocialBluesky, socialBluesky],
            ["socialSubstack", "Substack", t("profile.form.socialPlaceholders.substack"), setSocialSubstack, socialSubstack],
            ["socialFacebook", "Facebook", t("profile.form.socialPlaceholders.facebook"), setSocialFacebook, socialFacebook],
            ["socialTwitch", "Twitch", t("profile.form.socialPlaceholders.twitch"), setSocialTwitch, socialTwitch],
            ["socialLinkedin", "LinkedIn", t("profile.form.socialPlaceholders.linkedin"), setSocialLinkedin, socialLinkedin],
            ["socialWebsite", t("profile.form.websiteLabel"), t("profile.form.socialPlaceholders.website"), setSocialWebsite, socialWebsite],
          ] as const
        ).map(([field, label, placeholder, setter, value]) => (
          <div key={field}>
            <label htmlFor={`${fieldId}-${field}`} className={labelClasses}>
              {label}
            </label>
            <input
              id={`${fieldId}-${field}`}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              value={value}
              onChange={(event) => setter(event.target.value)}
              placeholder={placeholder}
              className={inputClasses}
              {...errorProps(field)}
            />
            <FieldError
              id={`${fieldId}-${field}-error`}
              message={fieldErrorText(field)}
            />
          </div>
        ))}

        <div>
          <label
            htmlFor={`${fieldId}-pinnedMediaUrl`}
            className={labelClasses}
          >
            {t("profile.form.pinnedLabel")}
          </label>
          <input
            id={`${fieldId}-pinnedMediaUrl`}
            type="url"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            value={pinnedMediaUrl}
            onChange={(event) => setPinnedMediaUrl(event.target.value)}
            placeholder={t("profile.form.pinnedPlaceholder")}
            className={inputClasses}
            {...errorProps("pinnedMediaUrl")}
          />
          <FieldError
            id={`${fieldId}-pinnedMediaUrl-error`}
            message={fieldErrorText("pinnedMediaUrl")}
          />
          <p className="mt-1.5 text-sm text-ink/60">
            {t("profile.form.pinnedHelp")}
          </p>
        </div>
      </fieldset>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70"
        >
          {saving ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : null}
          {t("profile.form.save")}
        </button>

        {formError ? (
          <p role="alert" className="text-sm text-red-800">
            {errorMessage(formError)}
          </p>
        ) : null}

        {saved && savedUsername ? (
          <div
            role="status"
            className="rounded-2xl border border-forest/25 bg-forest/5 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-forest">
              <Check aria-hidden="true" className="h-4 w-4" />
              {t("profile.form.saved")}
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
                {copied ? t("profile.form.copied") : t("profile.form.copyLink")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}
