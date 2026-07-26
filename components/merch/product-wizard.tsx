"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import type { AppLocale } from "@/i18n/locales";
import { formatMinorAmount } from "@/lib/i18n/format";
import {
  calculateMerchPricing,
  type MerchPricingConfig,
} from "@/lib/merch/pricing";
import type { WizardCuratedProduct } from "@/lib/merch/wizard-data";
import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Product-builder wizard (ADR-024, spec §12). Three practical steps: choose a
 * curated base product, customise it (details, colours/sizes, artwork with a
 * rights confirmation) and set a price with a live profit preview, then review
 * and create a draft. Variant ids are resolved server-side from the chosen
 * colour×size; mockups + submit-for-review are the next step from the dashboard.
 */

const inputCls =
  "min-h-11 w-full rounded-xl border border-stone bg-white px-3 text-ink focus:border-forest focus:ring-2 focus:ring-forest/20";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "product";
  const suffix = Math.abs(hashString(title + String(Date.now()))).toString(36).slice(0, 4);
  return `${base}-${suffix}`.replace(/^-+|-+$/g, "");
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

export function ProductWizard({
  products,
  pricingConfig,
}: {
  products: WizardCuratedProduct[];
  pricingConfig: MerchPricingConfig;
}) {
  const t = useTranslations("shop");
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<WizardCuratedProduct | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [placement, setPlacement] = useState("front");
  const [colours, setColours] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState("");
  const [artworkFileId, setArtworkFileId] = useState<string | null>(null);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const currency = (selected?.currency ?? "eur") as SupportedCurrency;
  const retailMinor = Math.round((Number.parseFloat(price) || 0) * 100);

  const breakdown = useMemo(() => {
    if (!selected || selected.printfulUnitCostMinor === null || retailMinor <= 0) {
      return null;
    }
    const r = calculateMerchPricing(
      {
        currency,
        retailUnitPriceMinor: retailMinor,
        quantity: 1,
        printfulUnitCostMinor: selected.printfulUnitCostMinor,
      },
      pricingConfig,
    );
    return r.ok ? r.breakdown : null;
  }, [selected, retailMinor, currency, pricingConfig]);

  function toggle(set: Set<string>, v: string): Set<string> {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  }

  function chooseProduct(p: WizardCuratedProduct) {
    setSelected(p);
    setColours(new Set());
    setSizes(new Set());
    setPlacement(p.defaultPlacement || p.allowedPlacements[0] || "front");
    setStep(2);
  }

  async function uploadArtwork(file: File) {
    if (!rights) {
      setError(t("wizard.needRights"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("rightsConfirmed", "true");
      const res = await fetch("/api/merch/artwork", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(t("wizard.error"));
      } else {
        setArtworkFileId(json.artworkFileId as string);
      }
    } catch {
      setError(t("wizard.error"));
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/merch/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          curatedProductId: selected.id,
          title,
          slug: slugify(title),
          description: description || undefined,
          currency,
          retailPriceMinor: retailMinor,
          placement,
          selectedColours: [...colours],
          selectedSizes: [...sizes],
          artworkFileId,
        }),
      });
      if (!res.ok) {
        setError(t("wizard.error"));
      } else {
        setDone(true);
      }
    } catch {
      setError(t("wizard.error"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 text-center sm:px-6">
        <h1 className="font-serif text-3xl text-ink">{t("wizard.created")}</h1>
        <button
          type="button"
          onClick={() => router.push("/dashboard/merch")}
          className="mt-6 min-h-11 rounded-full bg-forest px-6 text-sm font-medium text-white"
        >
          {t("wizard.backToMerch")}
        </button>
      </main>
    );
  }

  const canConfigure = title.trim() && colours.size > 0 && sizes.size > 0;
  const canReview = canConfigure && artworkFileId && retailMinor > 0;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-3xl text-ink">{t("wizard.title")}</h1>

      {/* Step 1 — choose product */}
      {step === 1 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium text-ink">{t("wizard.chooseTitle")}</h2>
          <p className="mt-1 text-sm text-ink/60">{t("wizard.chooseHint")}</p>
          {products.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-stone bg-mist p-6 text-ink/70">
              {t("wizard.noProducts")}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => chooseProduct(p)}
                    className="w-full rounded-3xl border border-stone bg-white p-5 text-left hover:border-forest"
                  >
                    <span className="block font-medium text-ink">{p.displayName}</span>
                    {p.printfulUnitCostMinor !== null && (
                      <span className="mt-1 block text-xs text-ink/50">
                        {t("wizard.prodCost")}: {formatMinorAmount(p.printfulUnitCostMinor, p.currency as SupportedCurrency, locale)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Step 2 — customise */}
      {step === 2 && selected && (
        <section className="mt-6 space-y-5">
          <h2 className="text-lg font-medium text-ink">{t("wizard.configureTitle")}</h2>

          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">{t("wizard.titleLabel")}</span>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">{t("wizard.descriptionLabel")}</span>
            <textarea className={`${inputCls} min-h-20 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          {selected.allowedPlacements.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-sm text-ink/70">{t("wizard.placementLabel")}</span>
              <select className={inputCls} value={placement} onChange={(e) => setPlacement(e.target.value)}>
                {selected.allowedPlacements.map((pl) => (
                  <option key={pl} value={pl}>{pl}</option>
                ))}
              </select>
            </label>
          )}

          <Chips label={t("wizard.coloursLabel")} options={selected.allowedColours} selected={colours} onToggle={(v) => setColours((s) => toggle(s, v))} />
          <Chips label={t("wizard.sizesLabel")} options={selected.allowedSizes} selected={sizes} onToggle={(v) => setSizes((s) => toggle(s, v))} />

          <fieldset className="rounded-2xl border border-stone p-4">
            <legend className="px-1 text-sm text-ink/70">{t("wizard.artworkLabel")}</legend>
            <p className="text-xs text-ink/50">{t("wizard.artworkHint")}</p>
            <label className="mt-3 flex items-start gap-2 text-xs text-ink/70">
              <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5" />
              <span>{t("wizard.rightsConfirm")}</span>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!rights || busy}
              className="mt-3 block w-full text-sm text-ink/70 file:mr-3 file:min-h-9 file:rounded-full file:border-0 file:bg-forest file:px-4 file:text-white disabled:opacity-50"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadArtwork(f);
              }}
            />
            {artworkFileId && <p className="mt-2 text-xs text-forest">{t("wizard.uploaded")}</p>}
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">{t("wizard.priceLabel")}</span>
            <input className={inputCls} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="20.00" />
            {selected.minimumRetailPriceMinor > 0 && (
              <span className="mt-1 block text-xs text-ink/50">
                {t("wizard.priceHint", { min: formatMinorAmount(selected.minimumRetailPriceMinor, currency, locale) })}
              </span>
            )}
          </label>

          {breakdown ? (
            <dl className="rounded-2xl bg-mist p-4 text-sm">
              <Row label={t("wizard.prodCost")} value={formatMinorAmount(breakdown.printfulProductCostMinor, currency, locale)} />
              <Row label={t("wizard.fee")} value={formatMinorAmount(breakdown.platformFeeMinor, currency, locale)} />
              <Row label={t("wizard.profit")} value={formatMinorAmount(breakdown.creatorProfitMinor, currency, locale)} strong />
            </dl>
          ) : selected.printfulUnitCostMinor === null ? (
            <p className="text-xs text-ink/50">{t("wizard.profitUnknown")}</p>
          ) : null}

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="min-h-11 rounded-full border border-stone px-5 text-sm">
              {t("wizard.back")}
            </button>
            <button
              type="button"
              disabled={!canReview}
              onClick={() => { setError(null); setStep(3); }}
              className="min-h-11 rounded-full bg-forest px-6 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("wizard.next")}
            </button>
          </div>
        </section>
      )}

      {/* Step 3 — review + create */}
      {step === 3 && selected && (
        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-medium text-ink">{t("wizard.reviewTitle")}</h2>
          <dl className="rounded-2xl border border-stone bg-white p-5 text-sm">
            <Row label={t("wizard.titleLabel")} value={title} />
            <Row label={t("wizard.coloursLabel")} value={[...colours].join(", ")} />
            <Row label={t("wizard.sizesLabel")} value={[...sizes].join(", ")} />
            <Row label={t("wizard.priceLabel")} value={formatMinorAmount(retailMinor, currency, locale)} />
            {breakdown && <Row label={t("wizard.profit")} value={formatMinorAmount(breakdown.creatorProfitMinor, currency, locale)} strong />}
          </dl>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="min-h-11 rounded-full border border-stone px-5 text-sm">
              {t("wizard.back")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="min-h-11 rounded-full bg-forest px-6 text-sm font-medium text-white disabled:opacity-50"
            >
              {t("wizard.createButton")}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-ink/70">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1 text-sm ${selected.has(o) ? "border-forest bg-forest/10 text-forest" : "border-stone text-ink/70"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <dt className="text-ink/50">{label}</dt>
      <dd className={strong ? "font-semibold text-forest" : "text-ink"}>{value}</dd>
    </div>
  );
}
