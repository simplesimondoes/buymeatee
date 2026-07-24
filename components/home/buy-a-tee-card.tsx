"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";

/**
 * Illustrative "buy a tee" moment — the core supporter interaction, made
 * tangible. Amounts are indicative and the creator is fictional (labelled
 * Example, per ADR-007); no checkout runs until a real creator page exists.
 */
const options = [
  { id: "tee1", label: "1 Tee", amount: 3 },
  { id: "tee3", label: "3 Tees", amount: 8 },
  { id: "holes9", label: "9 Holes", amount: 18 },
  { id: "holes18", label: "18 Holes", amount: 30 },
] as const;

export function BuyATeeCard() {
  const [selected, setSelected] = useState<string>("tee3");
  const amount =
    options.find((option) => option.id === selected)?.amount ?? options[0].amount;

  return (
    <div className="w-full max-w-md rounded-3xl border border-stone/80 bg-mist/95 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-full bg-forest font-serif text-base font-semibold text-gold"
        >
          AM
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold text-ink">
              Buy Alex a tee
            </span>
            <span className="rounded-md bg-stone px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/60">
              Example
            </span>
          </div>
          <p className="text-sm text-ink/60">
            Alex Morgan · 7.8 handicap · Road to Scratch
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {options.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(option.id)}
              className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                active
                  ? "border-forest bg-forest text-white"
                  : "border-stone bg-white text-forest hover:border-forest"
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span
                className={`block text-xs ${active ? "text-white/70" : "text-ink/50"}`}
              >
                £{option.amount}
              </span>
            </button>
          );
        })}
      </div>

      <input
        type="text"
        aria-label="Add a message of encouragement (optional)"
        placeholder="Add a message of encouragement (optional)"
        className="mt-4 w-full rounded-xl border border-stone bg-white px-3.5 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
      />

      <ButtonLink href="/sign-in" size="lg" className="mt-4 w-full">
        Support £{amount}
      </ButtonLink>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/50">
        <Lock aria-hidden="true" className="size-3.5" /> Secure checkout via{" "}
        <span className="font-medium text-ink/70">Stripe</span> · goes to Alex&apos;s
        goal
      </p>
    </div>
  );
}
