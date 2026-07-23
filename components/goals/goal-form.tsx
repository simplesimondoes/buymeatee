"use client";

import { LoaderCircle } from "lucide-react";
import { useId, useState } from "react";

import {
  validateGoalInput,
  type GoalFieldName,
  type GoalInput,
} from "@/lib/goals/goal-schema";
import { GOAL_DESCRIPTION_MAX_LENGTH } from "@/lib/goals/types";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import { parseMajorAmountToMinor } from "@/lib/payments/gift-schema";

export type GoalFormErrors = Partial<Record<GoalFieldName, string>>;

interface GoalFormProps {
  initialTitle?: string;
  initialDescription?: string;
  initialCurrency?: SupportedCurrency;
  /** Minor units; rendered back as a major-unit string for editing. */
  initialTargetAmount?: number | null;
  /** Goals with attributed support keep their currency (ADR-011). */
  currencyLocked?: boolean;
  submitLabel: string;
  onCancel: () => void;
  /** Resolves to server-side field errors, a form error, or null on success. */
  onSubmit: (
    input: GoalInput,
  ) => Promise<{ errors?: GoalFormErrors; error?: string } | null>;
}

const currencyLabels: Record<SupportedCurrency, string> = {
  gbp: "£ GBP",
  eur: "€ EUR",
};

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 aria-[invalid=true]:border-red-700";

function minorToMajorString(minor: number | null | undefined): string {
  if (!minor || minor <= 0) {
    return "";
  }
  const major = Math.floor(minor / 100);
  const rest = minor % 100;
  return rest === 0 ? String(major) : `${major}.${String(rest).padStart(2, "0")}`;
}

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

export function GoalForm({
  initialTitle = "",
  initialDescription = "",
  initialCurrency = "gbp",
  initialTargetAmount = null,
  currencyLocked = false,
  submitLabel,
  onCancel,
  onSubmit,
}: GoalFormProps) {
  const fieldId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [currency, setCurrency] = useState<SupportedCurrency>(initialCurrency);
  const [target, setTarget] = useState(minorToMajorString(initialTargetAmount));
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const targetAmount = parseMajorAmountToMinor(target);
    const validation = validateGoalInput({
      title,
      description,
      currency,
      targetAmount,
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
      setFormError(failure.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label
          htmlFor={`${fieldId}-title`}
          className="block text-sm font-medium text-ink/80"
        >
          What are you working towards?
        </label>
        <input
          id={`${fieldId}-title`}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="A season of tournament entries"
          className={inputClasses}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
        />
        <FieldError id={`${fieldId}-title-error`} message={errors.title} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label
            htmlFor={`${fieldId}-description`}
            className="block text-sm font-medium text-ink/80"
          >
            Why it matters{" "}
            <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              description.length > GOAL_DESCRIPTION_MAX_LENGTH
                ? "text-red-800"
                : "text-ink/50"
            }`}
          >
            {description.length}/{GOAL_DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={`${fieldId}-description`}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell supporters what this goal makes possible — green fees, travel, entries, coaching."
          className={inputClasses}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? `${fieldId}-description-error` : undefined
          }
        />
        <FieldError
          id={`${fieldId}-description-error`}
          message={errors.description}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${fieldId}-target`}
            className="block text-sm font-medium text-ink/80"
          >
            Target
          </label>
          <input
            id={`${fieldId}-target`}
            type="text"
            inputMode="decimal"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="500"
            className={inputClasses}
            aria-invalid={errors.targetAmount ? true : undefined}
            aria-describedby={
              errors.targetAmount ? `${fieldId}-target-error` : undefined
            }
          />
          <FieldError
            id={`${fieldId}-target-error`}
            message={errors.targetAmount}
          />
        </div>
        <div>
          <label
            htmlFor={`${fieldId}-currency`}
            className="block text-sm font-medium text-ink/80"
          >
            Currency
          </label>
          <select
            id={`${fieldId}-currency`}
            value={currency}
            disabled={currencyLocked}
            onChange={(event) =>
              setCurrency(event.target.value as SupportedCurrency)
            }
            className={`${inputClasses} disabled:bg-mist disabled:text-ink/60`}
            aria-describedby={
              currencyLocked ? `${fieldId}-currency-locked` : undefined
            }
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabels[code]}
              </option>
            ))}
          </select>
          {currencyLocked ? (
            <p id={`${fieldId}-currency-locked`} className="mt-1.5 text-xs text-ink/60">
              This goal has received support, so its currency can&apos;t change.
            </p>
          ) : null}
        </div>
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
          Cancel
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
