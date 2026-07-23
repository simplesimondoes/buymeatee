"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";
import { calculateFees, type FeeConfig } from "@/lib/payments/fees";
import {
  GIFT_MESSAGE_MAX_LENGTH,
  parseMajorAmountToMinor,
  validateGiftInput,
} from "@/lib/payments/gift-schema";

const inputClasses =
  "mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-forest";

/**
 * Donor-side gift composer. The breakdown shown here is an estimate rendered
 * from the same fee module the server uses; the server recalculates and
 * validates everything before creating the Checkout Session.
 */
export interface ComposerGoalOption {
  id: string;
  title: string;
}

export function GiftComposer({
  recipientUsername,
  recipientName,
  currency,
  presetAmounts,
  feeConfig,
  goals = [],
}: {
  recipientUsername: string;
  recipientName: string;
  currency: SupportedCurrency;
  presetAmounts: number[];
  feeConfig: FeeConfig;
  /** The recipient's active goals in this currency. Optional by design. */
  goals?: ComposerGoalOption[];
}) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    presetAmounts[1] ?? presetAmounts[0] ?? null,
  );
  const [customRaw, setCustomRaw] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [goalId, setGoalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customMinor = customRaw.trim() === "" ? null : parseMajorAmountToMinor(customRaw);
  const giftAmount = selectedPreset ?? customMinor;

  const fees = useMemo(
    () =>
      giftAmount !== null
        ? calculateFees(giftAmount, currency, feeConfig)
        : null,
    [giftAmount, currency, feeConfig],
  );

  const amountError =
    customRaw.trim() !== "" && customMinor === null
      ? "Enter an amount like 5 or 7.50."
      : fees && !fees.ok
        ? fees.error === "below-minimum"
          ? `The minimum Tee is ${formatMinorAmount(feeConfig.minimumGift[currency], currency)}.`
          : fees.error === "above-maximum"
            ? `The maximum Tee is ${formatMinorAmount(feeConfig.maximumGift[currency], currency)}.`
            : "Enter a valid amount."
        : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      recipientUsername,
      giftAmount,
      currency,
      senderName,
      senderEmail,
      message,
      isAnonymous,
      goalId: goalId || undefined,
    };
    const validation = validateGiftInput(payload);
    if (!validation.ok || !fees?.ok) {
      setError("Please check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (response.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <fieldset>
        <legend className="text-sm font-medium text-forest">
          Choose your Tee
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              aria-pressed={selectedPreset === amount}
              onClick={() => {
                setSelectedPreset(amount);
                setCustomRaw("");
              }}
              className={`min-h-11 rounded-full border px-5 text-sm font-medium transition-colors ${
                selectedPreset === amount
                  ? "border-forest bg-forest text-white"
                  : "border-stone bg-white text-ink hover:border-forest/40"
              }`}
            >
              {formatMinorAmount(amount, currency)}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label htmlFor="gift-custom" className="text-sm font-medium text-forest">
            Or a custom amount ({currency === "gbp" ? "£" : "€"})
          </label>
          <input
            id="gift-custom"
            type="text"
            inputMode="decimal"
            placeholder="7.50"
            value={customRaw}
            onChange={(event) => {
              setCustomRaw(event.target.value);
              setSelectedPreset(null);
            }}
            aria-invalid={Boolean(amountError)}
            aria-describedby={amountError ? "gift-amount-error" : undefined}
            className={inputClasses}
          />
          {amountError ? (
            <p
              id="gift-amount-error"
              className="mt-1.5 flex items-center gap-1.5 text-sm text-red-800"
            >
              <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
              {amountError}
            </p>
          ) : null}
        </div>
      </fieldset>

      {goals.length > 0 ? (
        <div>
          <label htmlFor="gift-goal" className="text-sm font-medium text-forest">
            Put this Tee toward{" "}
            <span className="font-normal text-ink/70">(optional)</span>
          </label>
          <select
            id="gift-goal"
            value={goalId}
            onChange={(event) => setGoalId(event.target.value)}
            className={inputClasses}
          >
            <option value="">General support for {recipientName}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink/60">
            Goal progress only counts confirmed payments — your Tee shows up
            once it&apos;s verified.
          </p>
        </div>
      ) : null}

      <div>
        <label htmlFor="gift-sender" className="text-sm font-medium text-forest">
          Your name
        </label>
        <input
          id="gift-sender"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          value={senderName}
          onChange={(event) => setSenderName(event.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="gift-email" className="text-sm font-medium text-forest">
          Email for your receipt{" "}
          <span className="font-normal text-ink/70">(optional)</span>
        </label>
        <input
          id="gift-email"
          type="email"
          autoComplete="email"
          value={senderEmail}
          onChange={(event) => setSenderEmail(event.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="gift-message" className="text-sm font-medium text-forest">
          Message for {recipientName}{" "}
          <span className="font-normal text-ink/70">(optional)</span>
        </label>
        <textarea
          id="gift-message"
          rows={3}
          maxLength={GIFT_MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={inputClasses}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[--color-forest]"
        />
        <span>Keep my name private — show this Tee as from “Anonymous”.</span>
      </label>

      {fees?.ok ? (
        <dl
          aria-label="Payment breakdown"
          className="space-y-1.5 rounded-2xl border border-stone bg-mist p-5 text-sm text-ink/80"
        >
          <div className="flex justify-between">
            <dt>Your Tee</dt>
            <dd className="font-medium text-ink">
              {formatMinorAmount(fees.breakdown.giftAmount, currency)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>BuyMeATee platform fee</dt>
            <dd>{formatMinorAmount(fees.breakdown.platformFeeAmount, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Payment handling</dt>
            <dd>
              {formatMinorAmount(fees.breakdown.paymentHandlingAmount, currency)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-stone pt-1.5 text-base font-semibold text-ink">
            <dt>Total</dt>
            <dd>{formatMinorAmount(fees.breakdown.totalChargeAmount, currency)}</dd>
          </div>
          <p className="pt-1 text-xs text-ink/65">
            {recipientName} receives{" "}
            {formatMinorAmount(fees.breakdown.recipientTargetAmount, currency)}.
            Payment handling covers estimated card-processing costs.
          </p>
        </dl>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !fees?.ok}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-7 text-base font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70"
      >
        {submitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
            Preparing secure checkout…
          </>
        ) : (
          `Send a Tee with Stripe`
        )}
      </button>
      <p className="text-center text-xs text-ink/60">
        You&apos;ll pay on Stripe&apos;s secure checkout. BuyMeATee never sees
        your card details.
      </p>
    </form>
  );
}
