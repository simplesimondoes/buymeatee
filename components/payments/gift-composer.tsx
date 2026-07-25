"use client";

import { CircleAlert, Flag, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { useSupportTarget } from "@/components/payments/support-target-context";
import { goalProgressPercent } from "@/lib/goals/types";
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
 *
 * The composer is always *scoped*: it reads the support target chosen upstream
 * (a goal card, a wish-list "Fund this", or the general CTA) and shows it as a
 * header the supporter can change — never a hidden dropdown defaulting to
 * general. The target decides `goalId` / `wishlistItemId` on the payload.
 */
export interface ComposerGoalOption {
  id: string;
  title: string;
  /** Minor units — current progress, so the header can show it. */
  raised: number;
  target: number;
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
  const [changingTarget, setChangingTarget] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { target, select, clear } = useSupportTarget();
  const goalTarget = target?.kind === "goal" ? target : null;
  const wishlistTarget = target?.kind === "wishlist" ? target : null;

  const customMinor = customRaw.trim() === "" ? null : parseMajorAmountToMinor(customRaw);
  // A wish-list item is funded outright at its exact price; otherwise the
  // supporter picks the amount.
  const giftAmount = wishlistTarget
    ? wishlistTarget.priceAmount
    : selectedPreset ?? customMinor;

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

  // Live "brings this goal to X%" once an amount is valid.
  const projectedGoalPercent =
    goalTarget && fees?.ok
      ? goalProgressPercent(goalTarget.raised + fees.breakdown.giftAmount, goalTarget.target)
      : null;

  const submitLabel = goalTarget
    ? "Support this goal"
    : wishlistTarget
      ? "Fund this item"
      : `Send a Tee`;

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
      // Exactly one of these is set, decided by the chosen target.
      goalId: goalTarget?.id,
      wishlistItemId: wishlistTarget?.id,
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
      {wishlistTarget ? (
        <div className="rounded-2xl border border-forest/30 bg-forest/5 p-5">
          <p className="text-sm font-medium text-forest">You&apos;re funding</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="font-serif text-lg font-semibold text-forest">
              {wishlistTarget.title}
            </p>
            <p className="shrink-0 text-lg font-semibold text-forest">
              {formatMinorAmount(wishlistTarget.priceAmount, currency)}
            </p>
          </div>
          <p className="mt-1 text-xs text-ink/65">
            One Tee covers this item in full. It shows as funded once your
            payment is verified.
          </p>
          <button
            type="button"
            onClick={clear}
            className="mt-3 text-sm font-medium text-forest underline underline-offset-2 hover:text-forest-dark"
          >
            Choose a different amount instead
          </button>
        </div>
      ) : (
        <>
          {goals.length > 0 || goalTarget ? (
            <div className="rounded-2xl border border-forest/25 bg-forest/5 p-4">
              <div className="flex items-start gap-3">
                <Flag aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-forest/80">
                    Supporting
                  </p>
                  <p className="truncate font-medium text-forest">
                    {goalTarget ? goalTarget.title : `General support for ${recipientName}`}
                  </p>
                  {goalTarget ? (
                    <p className="mt-0.5 text-xs text-forest/80">
                      {formatMinorAmount(goalTarget.raised, currency)} of{" "}
                      {formatMinorAmount(goalTarget.target, currency)} ·{" "}
                      {goalProgressPercent(goalTarget.raised, goalTarget.target)}%
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-expanded={changingTarget}
                  onClick={() => setChangingTarget((open) => !open)}
                  className="shrink-0 text-sm font-medium text-forest underline underline-offset-2 hover:text-forest-dark"
                >
                  Change
                </button>
              </div>

              {changingTarget ? (
                <div
                  role="radiogroup"
                  aria-label="Choose what to support"
                  className="mt-3 space-y-1 border-t border-forest/15 pt-3"
                >
                  <TargetOption
                    label={`General support for ${recipientName}`}
                    checked={!goalTarget}
                    onSelect={() => {
                      clear();
                      setChangingTarget(false);
                    }}
                  />
                  {goals.map((goal) => (
                    <TargetOption
                      key={goal.id}
                      label={goal.title}
                      checked={goalTarget?.id === goal.id}
                      onSelect={() => {
                        select({ kind: "goal", ...goal });
                        setChangingTarget(false);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

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
            {goalTarget ? (
              <p className="mt-3 text-xs text-ink/70">
                {projectedGoalPercent !== null && projectedGoalPercent >= 1 ? (
                  <>
                    Your Tee brings this goal to{" "}
                    <span className="font-medium text-forest">{projectedGoalPercent}%</span>.{" "}
                  </>
                ) : null}
                Goal progress only counts confirmed payments — your Tee shows up
                once it&apos;s verified.
              </p>
            ) : null}
          </fieldset>
        </>
      )}

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
          `${submitLabel} with Stripe`
        )}
      </button>
      <p className="text-center text-xs text-ink/60">
        You&apos;ll pay on Stripe&apos;s secure checkout. BuyMeATee never sees
        your card details.
      </p>
    </form>
  );
}

function TargetOption({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        checked ? "bg-forest/10 text-forest" : "text-ink/80 hover:bg-forest/5"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
          checked ? "border-4 border-forest" : "border border-stone"
        }`}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}
