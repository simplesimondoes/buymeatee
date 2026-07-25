import { defaultLocale, type AppLocale } from "@/i18n/locales";

import { accessibilityDe } from "./accessibility.de";
import { accessibilityFr } from "./accessibility.fr";
import { accessibilityEs } from "./accessibility.es";
import { accessibilityIt } from "./accessibility.it";
import { accessibilityJa } from "./accessibility.ja";
import { accessibilityKo } from "./accessibility.ko";
import { accessibilityPt } from "./accessibility.pt";
import { impressumDe } from "./impressum.de";
import { impressumFr } from "./impressum.fr";
import { impressumEs } from "./impressum.es";
import { impressumIt } from "./impressum.it";
import { impressumJa } from "./impressum.ja";
import { impressumKo } from "./impressum.ko";
import { impressumPt } from "./impressum.pt";
import { privacyDe } from "./privacy.de";
import { privacyFr } from "./privacy.fr";
import { privacyEs } from "./privacy.es";
import { privacyIt } from "./privacy.it";
import { privacyJa } from "./privacy.ja";
import { privacyKo } from "./privacy.ko";
import { privacyPt } from "./privacy.pt";
import { termsDe } from "./terms.de";
import { termsFr } from "./terms.fr";
import { termsEs } from "./terms.es";
import { termsIt } from "./terms.it";
import { termsJa } from "./terms.ja";
import { termsKo } from "./terms.ko";
import { termsPt } from "./terms.pt";
import { accessibilityEn } from "./accessibility.en";
import { impressumEn } from "./impressum.en";
import { privacyEn } from "./privacy.en";
import { termsEn } from "./terms.en";
import type { LegalDocument, LegalDocumentKind } from "./types";

export type {
  LegalBlock,
  LegalDetail,
  LegalDocument,
  LegalDocumentKind,
  LegalSection,
} from "./types";

/**
 * Per-document registry of translations. English is required and is the
 * legally binding source text; every other locale falls back to English
 * until a reviewed translation exists.
 *
 * Convention for adding a translation (e.g. German terms):
 *   1. Create `terms.de.ts` exporting a `LegalDocument` (same shape).
 *   2. Register it here: `terms: { en: termsEn, de: termsDe }`.
 *   3. The translation MUST keep every clause of the English source —
 *      nothing shortened, reworded in substance, or dropped — and is
 *      provided for convenience only: the English version governs (the
 *      UI shows a governing-language notice on all non-English locales).
 *   4. Translations require professional legal review before production
 *      reliance (see docs/i18n.md).
 */
const registry: Record<
  LegalDocumentKind,
  Partial<Record<AppLocale, LegalDocument>> & { en: LegalDocument }
> = {
  terms: {
    en: termsEn,
    de: termsDe,
    fr: termsFr,
    es: termsEs,
    it: termsIt,
    ja: termsJa,
    ko: termsKo,
    pt: termsPt,
  },
  privacy: {
    en: privacyEn,
    de: privacyDe,
    fr: privacyFr,
    es: privacyEs,
    it: privacyIt,
    ja: privacyJa,
    ko: privacyKo,
    pt: privacyPt,
  },
  impressum: {
    en: impressumEn,
    de: impressumDe,
    fr: impressumFr,
    es: impressumEs,
    it: impressumIt,
    ja: impressumJa,
    ko: impressumKo,
    pt: impressumPt,
  },
  accessibility: {
    en: accessibilityEn,
    de: accessibilityDe,
    fr: accessibilityFr,
    es: accessibilityEs,
    it: accessibilityIt,
    ja: accessibilityJa,
    ko: accessibilityKo,
    pt: accessibilityPt,
  },
};

/** Resolve a legal document for a locale, falling back to English. */
export function getLegalDocument(
  kind: LegalDocumentKind,
  locale: AppLocale,
): LegalDocument {
  const documents = registry[kind];
  return documents[locale] ?? documents[defaultLocale] ?? documents.en;
}
