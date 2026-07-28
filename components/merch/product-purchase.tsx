"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { formatMinorAmount } from "@/lib/i18n/format";
import type { AppLocale } from "@/i18n/locales";
import { CONNECT_COUNTRIES } from "@/lib/payments/countries";
import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Customer purchase form for a published merch product (ADR-024, spec §13). The
 * shipping address is collected here (needed for the live Printful shipping
 * quote); payment happens on the Stripe-hosted Checkout page it redirects to.
 * All amounts are recomputed server-side.
 */

const field =
  "min-h-11 w-full rounded-xl border border-stone bg-white px-3 text-ink focus:border-forest focus:ring-2 focus:ring-forest/20";

export function ProductPurchase({
  creatorId,
  productId,
  currency,
  retailPriceMinor,
  colours,
  sizes,
  cancelPath,
}: {
  creatorId: string;
  productId: string;
  currency: SupportedCurrency;
  retailPriceMinor: number;
  colours: string[];
  sizes: string[];
  cancelPath: string;
}) {
  const t = useTranslations("shop");
  const locale = useLocale() as AppLocale;

  const [colour, setColour] = useState(colours[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [r, setR] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    stateCode: "",
    zip: "",
    countryCode: CONNECT_COUNTRIES[0]?.code ?? "GB",
    email: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof r) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setR((prev) => ({ ...prev, [k]: e.target.value }));

  const canBuy =
    colour && size && r.name && r.address1 && r.city && r.zip && r.countryCode && r.email;

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/merch/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          creatorId,
          productId,
          colour,
          size,
          quantity,
          currency,
          locale,
          cancelPath,
          buyerEmail: r.email,
          recipient: r,
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        setError(t("product.error"));
        setBusy(false);
      }
    } catch {
      setError(t("product.error"));
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-2xl font-semibold text-forest">
        {formatMinorAmount(retailPriceMinor, currency, locale)}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="mb-1 block text-sm text-ink/70">{t("product.colour")}</span>
          <select className={field} value={colour} onChange={(e) => setColour(e.target.value)}>
            {colours.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm text-ink/70">{t("product.size")}</span>
          <select className={field} value={size} onChange={(e) => setSize(e.target.value)}>
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="block w-28">
        <span className="mb-1 block text-sm text-ink/70">{t("product.quantity")}</span>
        <select className={field} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </label>

      <fieldset className="space-y-3 border-t border-stone pt-4">
        <legend className="text-sm font-medium text-ink">{t("product.shippingDetails")}</legend>
        {/*
          Each field carries a visible <label> and an autocomplete token —
          placeholders are not accessible names (WCAG 3.3.2 / 1.3.5). Required
          fields are marked; address line 2 and state/province are optional.
        */}
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">{t("product.fullName")}</span>
          <input className={field} autoComplete="name" required value={r.name} onChange={set("name")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">{t("product.address1")}</span>
          <input className={field} autoComplete="address-line1" required value={r.address1} onChange={set("address1")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">{t("product.address2")}</span>
          <input className={field} autoComplete="address-line2" value={r.address2} onChange={set("address2")} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">{t("product.city")}</span>
            <input className={field} autoComplete="address-level2" required value={r.city} onChange={set("city")} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">{t("product.postcode")}</span>
            <input className={field} autoComplete="postal-code" required value={r.zip} onChange={set("zip")} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">{t("product.state")}</span>
          <input className={field} autoComplete="address-level1" value={r.stateCode} onChange={set("stateCode")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">{t("product.country")}</span>
          <select className={field} autoComplete="country" value={r.countryCode} onChange={set("countryCode")}>
            {CONNECT_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">{t("product.email")}</span>
          <input className={field} type="email" autoComplete="email" required value={r.email} onChange={set("email")} />
        </label>
        <p className="text-xs text-ink/70">{t("product.emailHint")}</p>
      </fieldset>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={!canBuy || busy}
        onClick={buy}
        className="min-h-12 w-full rounded-full bg-forest px-6 font-medium text-white disabled:opacity-50"
      >
        {t("product.buyNow")}
      </button>
    </div>
  );
}
