"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import type { ErrorDetail } from "@/lib/i18n/errors";
import { parseMajorAmountToMinor } from "@/lib/payments/gift-schema";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import {
  validateWishlistItemInput,
  type WishlistFieldName,
  type WishlistItemInput,
} from "@/lib/wishlist/item-schema";
import { WISHLIST_DESCRIPTION_MAX_LENGTH } from "@/lib/wishlist/types";

/** Field errors: coded details from the schema/API, or legacy raw strings. */
export type WishlistFormErrors = Partial<
  Record<WishlistFieldName, ErrorDetail | string>
>;

interface WishlistItemFormProps {
  initialTitle?: string;
  initialDescription?: string;
  initialCurrency?: SupportedCurrency;
  /** Minor units; rendered back as a major-unit string for editing. */
  initialPriceAmount?: number | null;
  /** Funded items keep their price and currency (ADR-018). */
  priceLocked?: boolean;
  /** When set, items are locked to the creator's payout currency. */
  payoutCurrency?: SupportedCurrency;
  submitLabel: string;
  onCancel: () => void;
  /** Resolves to server-side field errors, a form error, or null on success. */
  onSubmit: (
    input: WishlistItemInput,
  ) => Promise<{ errors?: WishlistFormErrors; error?: ErrorDetail | string } | null>;
}

const currencyLabels: Record<SupportedCurrency, string> = {
  gbp: "£ GBP",
  eur: "€ EUR",
  usd: "$ USD",
  cad: "CA$ CAD",
  aud: "A$ AUD",
  nzd: "NZ$ NZD",
  chf: "CHF",
  sek: "kr SEK",
  nok: "kr NOK",
  dkk: "kr DKK",
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

export function WishlistItemForm({
  initialTitle = "",
  initialDescription = "",
  initialCurrency = "gbp",
  initialPriceAmount = null,
  priceLocked = false,
  payoutCurrency,
  submitLabel,
  onCancel,
  onSubmit,
}: WishlistItemFormProps) {
  const t = useTranslations("dashboard");
  const errorMessage = useErrorMessage();
  const fieldId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  // A funded item keeps its own currency; otherwise lock to the payout
  // currency when we know it (so no one can create an unfundable item).
  const [currency, setCurrency] = useState<SupportedCurrency>(
    priceLocked ? initialCurrency : payoutCurrency ?? initialCurrency,
  );
  const currencyDisabled = priceLocked || payoutCurrency !== undefined;
  const [price, setPrice] = useState(minorToMajorString(initialPriceAmount));
  const [errors, setErrors] = useState<WishlistFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fieldError = (field: WishlistFieldName): string | undefined =>
    errors[field] === undefined ? undefined : errorMessage(errors[field]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const priceAmount = parseMajorAmountToMinor(price);
    const validation = validateWishlistItemInput({
      title,
      description,
      currency,
      priceAmount,
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
        <label
          htmlFor={`${fieldId}-title`}
          className="block text-sm font-medium text-ink/80"
        >
          {t("wishlist.form.titleLabel")}
        </label>
        <input
          id={`${fieldId}-title`}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("wishlist.form.titlePlaceholder")}
          className={inputClasses}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
        />
        <FieldError id={`${fieldId}-title-error`} message={fieldError("title")} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label
            htmlFor={`${fieldId}-description`}
            className="block text-sm font-medium text-ink/80"
          >
            {t("wishlist.form.descriptionLabel")}{" "}
            <span className="font-normal text-ink/50">
              {t("wishlist.form.optional")}
            </span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              description.length > WISHLIST_DESCRIPTION_MAX_LENGTH
                ? "text-red-800"
                : "text-ink/50"
            }`}
          >
            {description.length}/{WISHLIST_DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={`${fieldId}-description`}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("wishlist.form.descriptionPlaceholder")}
          className={inputClasses}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? `${fieldId}-description-error` : undefined
          }
        />
        <FieldError
          id={`${fieldId}-description-error`}
          message={fieldError("description")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${fieldId}-price`}
            className="block text-sm font-medium text-ink/80"
          >
            {t("wishlist.form.priceLabel")}
          </label>
          <input
            id={`${fieldId}-price`}
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder={t("wishlist.form.pricePlaceholder")}
            className={inputClasses}
            disabled={priceLocked}
            aria-invalid={errors.priceAmount ? true : undefined}
            aria-describedby={
              errors.priceAmount
                ? `${fieldId}-price-error`
                : priceLocked
                  ? `${fieldId}-price-locked`
                  : undefined
            }
          />
          <FieldError
            id={`${fieldId}-price-error`}
            message={fieldError("priceAmount")}
          />
          {priceLocked ? (
            <p id={`${fieldId}-price-locked`} className="mt-1.5 text-xs text-ink/60">
              {t("wishlist.form.priceLockedHelp")}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ink/60">
              {t("wishlist.form.priceHelp")}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={`${fieldId}-currency`}
            className="block text-sm font-medium text-ink/80"
          >
            {t("wishlist.form.currencyLabel")}
          </label>
          <select
            id={`${fieldId}-currency`}
            value={currency}
            disabled={currencyDisabled}
            onChange={(event) =>
              setCurrency(event.target.value as SupportedCurrency)
            }
            className={`${inputClasses} disabled:bg-mist disabled:text-ink/60`}
            aria-describedby={
              currencyDisabled ? `${fieldId}-currency-locked` : undefined
            }
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabels[code]}
              </option>
            ))}
          </select>
          {priceLocked ? (
            <p id={`${fieldId}-currency-locked`} className="mt-1.5 text-xs text-ink/60">
              {t("wishlist.form.currencyLockedHelp")}
            </p>
          ) : payoutCurrency ? (
            <p id={`${fieldId}-currency-locked`} className="mt-1.5 text-xs text-ink/60">
              {t("wishlist.form.currencyPayoutHelp")}
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
