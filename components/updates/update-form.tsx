"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import type { ErrorDetail } from "@/lib/i18n/errors";
import {
  validateUpdateInput,
  type UpdateFieldName,
  type UpdateInput,
} from "@/lib/updates/update-schema";
import { UPDATE_BODY_MAX_LENGTH } from "@/lib/updates/types";

/** Field errors: coded details from the schema/API, or legacy raw strings. */
export type UpdateFormErrors = Partial<
  Record<UpdateFieldName, ErrorDetail | string>
>;

interface UpdateFormProps {
  initialTitle?: string;
  initialBody?: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (
    input: UpdateInput,
  ) => Promise<{ errors?: UpdateFormErrors; error?: ErrorDetail | string } | null>;
}

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 aria-[invalid=true]:border-red-700";

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

export function UpdateForm({
  initialTitle = "",
  initialBody = "",
  submitLabel,
  onCancel,
  onSubmit,
}: UpdateFormProps) {
  const t = useTranslations("dashboard");
  const errorMessage = useErrorMessage();
  const fieldId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [errors, setErrors] = useState<UpdateFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fieldError = (field: UpdateFieldName): string | undefined =>
    errors[field] === undefined ? undefined : errorMessage(errors[field]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const validation = validateUpdateInput({ title, body });
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
        <label
          htmlFor={`${fieldId}-title`}
          className="block text-sm font-medium text-ink/80"
        >
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
          <label
            htmlFor={`${fieldId}-body`}
            className="block text-sm font-medium text-ink/80"
          >
            {t("updates.form.bodyLabel")}
          </label>
          <span
            className={`text-xs tabular-nums ${
              body.length > UPDATE_BODY_MAX_LENGTH ? "text-red-800" : "text-ink/50"
            }`}
          >
            {body.length}/{UPDATE_BODY_MAX_LENGTH}
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
          className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
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
