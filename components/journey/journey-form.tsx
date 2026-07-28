"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import type { ErrorDetail } from "@/lib/i18n/errors";
import {
  validatePostInput,
  type PostFieldName,
  type PostInput,
} from "@/lib/journey/post-schema";
import { POST_BODY_MAX_LENGTH } from "@/lib/journey/types";

/** Field errors: coded details from the schema/API, or legacy raw strings. */
export type PostFormErrors = Partial<Record<PostFieldName, ErrorDetail | string>>;

interface JourneyFormProps {
  initialTitle?: string;
  initialBody?: string;
  initialVideoUrl?: string;
  initialMilestoneLabel?: string;
  /** Preserved unchanged (auto-milestone posts carry a goal link). */
  goalId?: string | null;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (
    input: PostInput,
  ) => Promise<{ errors?: PostFormErrors; error?: ErrorDetail | string } | null>;
}

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 aria-[invalid=true]:border-red-700";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-800">
      {message}
    </p>
  );
}

export function JourneyForm({
  initialTitle = "",
  initialBody = "",
  initialVideoUrl = "",
  initialMilestoneLabel = "",
  goalId = null,
  submitLabel,
  onCancel,
  onSubmit,
}: JourneyFormProps) {
  const t = useTranslations("dashboard");
  const errorMessage = useErrorMessage();
  const fieldId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [milestoneLabel, setMilestoneLabel] = useState(initialMilestoneLabel);
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fieldError = (field: PostFieldName): string | undefined =>
    errors[field] === undefined ? undefined : errorMessage(errors[field]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const validation = validatePostInput({
      title,
      body,
      videoUrl,
      milestoneLabel,
      goalId,
    });
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    const failure = await onSubmit(validation.data);
    setSaving(false);
    if (failure?.errors) {
      setErrors(failure.errors);
    } else if (failure?.error) {
      setFormError(errorMessage(failure.error));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor={`${fieldId}-title`} className="block text-sm font-medium text-ink/80">
          {t("updates.form.titleLabel")}
        </label>
        <input
          id={`${fieldId}-title`}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("updates.form.titlePlaceholder")}
          className={inputClasses}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
        />
        <FieldError id={`${fieldId}-title-error`} message={fieldError("title")} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${fieldId}-body`} className="block text-sm font-medium text-ink/80">
            {t("updates.form.bodyLabel")}
          </label>
          <span
            className={`text-xs tabular-nums ${
              body.length > POST_BODY_MAX_LENGTH ? "text-red-800" : "text-ink/70"
            }`}
          >
            {body.length}/{POST_BODY_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={`${fieldId}-body`}
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("updates.form.bodyPlaceholder")}
          className={`${inputClasses} font-mono text-sm`}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? `${fieldId}-body-error` : undefined}
        />
        <FieldError id={`${fieldId}-body-error`} message={fieldError("body")} />
      </div>

      <div>
        <label htmlFor={`${fieldId}-video`} className="block text-sm font-medium text-ink/80">
          {t("updates.form.videoLabel")}
        </label>
        <input
          id={`${fieldId}-video`}
          type="url"
          inputMode="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder={t("updates.form.videoPlaceholder")}
          className={inputClasses}
          aria-invalid={errors.videoUrl ? true : undefined}
          aria-describedby={errors.videoUrl ? `${fieldId}-video-error` : undefined}
        />
        <FieldError id={`${fieldId}-video-error`} message={fieldError("videoUrl")} />
      </div>

      <div>
        <label
          htmlFor={`${fieldId}-milestone`}
          className="block text-sm font-medium text-ink/80"
        >
          {t("updates.form.milestoneLabel")}
        </label>
        <input
          id={`${fieldId}-milestone`}
          type="text"
          value={milestoneLabel}
          onChange={(event) => setMilestoneLabel(event.target.value)}
          placeholder={t("updates.form.milestonePlaceholder")}
          className={inputClasses}
          aria-invalid={errors.milestoneLabel ? true : undefined}
          aria-describedby={`${fieldId}-milestone-help`}
        />
        <p id={`${fieldId}-milestone-help`} className="mt-1.5 text-xs text-ink/70">
          {t("updates.form.milestoneHelp")}
        </p>
        <FieldError id={`${fieldId}-milestone-error`} message={fieldError("milestoneLabel")} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70"
        >
          {saving ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : null}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-ink/70 transition-colors hover:text-ink"
        >
          {t("actions.cancel")}
        </button>
        {formError ? (
          <p role="alert" className="w-full text-sm text-red-800">
            {formError}
          </p>
        ) : null}
      </div>
    </form>
  );
}
