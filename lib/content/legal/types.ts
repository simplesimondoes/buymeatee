/**
 * Typed structure for legal documents (Terms, Privacy, Impressum,
 * Accessibility). The English files (`*.en.ts`) are the legally binding
 * source text; translated documents (`*.de.ts`, `*.fr.ts`, …) are added to
 * the per-document registry in `index.ts` and are convenience-only.
 *
 * Text fields support the same lightweight inline-markdown convention as
 * `lib/content/inline.ts` — `[label](/href)` for links — plus `**strong**`
 * and `*emphasis*`. Internal hrefs (starting with "/") render through the
 * i18n-aware Link so cross-links keep the visitor's locale; `mailto:` and
 * `tel:` render as plain anchors; external URLs open in a new tab.
 */

export type LegalDocumentKind =
  | "terms"
  | "privacy"
  | "impressum"
  | "accessibility";

/** A labelled contact detail (e.g. Email / Phone on the Impressum). */
export type LegalDetail = {
  /** Small-caps label above the value. */
  label: string;
  /** Inline-markdown value, typically a mailto:/tel: link. */
  value: string;
};

/**
 * One ordered content block. Blocks keep the original interleaving of
 * paragraphs, lists and callouts inside a section.
 */
export type LegalBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  /** Address-style block: lines joined by line breaks in one paragraph. */
  | { kind: "lines"; lines: string[] }
  | { kind: "details"; items: LegalDetail[] }
  /** Highlighted aside rendered as a role="note" callout. */
  | { kind: "note"; text: string }
  /** Small muted footnote paragraph (e.g. cross-reference asides). */
  | { kind: "footnote"; text: string };

export type LegalSection = {
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  /** Page heading (H1) and document title. */
  title: string;
  /** Short label used in the breadcrumb trail. */
  breadcrumbLabel: string;
  /** One-line intro shown under the page heading. */
  intro: string;
  /**
   * ISO date (YYYY-MM-DD) of the latest revision, rendered locale-aware via
   * formatDate. Omit for pages that show no revision date (Impressum).
   */
  lastUpdated?: string;
  /**
   * Body of the "Draft — pending legal review." banner. The bold label
   * itself is chrome (messages legal.draftBanner); this is the page-specific
   * explanation. Omit for pages without the banner.
   */
  draftNote?: string;
  sections: LegalSection[];
  /** Blocks rendered after the last section (cross-references, footnotes). */
  closing?: LegalBlock[];
};
