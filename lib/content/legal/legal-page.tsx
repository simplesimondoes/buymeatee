import { Languages, ScrollText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import type { AppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { parseInline } from "@/lib/content/inline";
import { formatDate } from "@/lib/i18n/format";

import { getLegalDocument } from "./index";
import type { LegalBlock, LegalDocumentKind } from "./types";

/**
 * Shared server-side renderer for the legal pages (terms, privacy,
 * impressum, accessibility). Pages stay thin: they resolve the locale and
 * render <LegalPage kind=… locale=…/>. All prose comes from the structured
 * LegalDocument (lib/content/legal); only chrome (draft-banner label,
 * governing-language notice, "Last updated" and metadata) comes from the
 * "legal" message namespace.
 */

const sectionHeading =
  "mt-10 font-serif text-2xl font-semibold tracking-tight text-forest";
const paragraph = "mt-4 text-base leading-relaxed text-ink/80";
const list =
  "mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-ink/80 marker:text-gold-deep";
const detailLabel =
  "text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep";
const noteBox =
  "rounded-2xl border border-gold/40 bg-mist p-5 text-sm leading-relaxed text-ink/80";
const linkClass = "font-medium text-gold-deep underline hover:text-forest";

const EMPHASIS_PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Render **strong** and *em* within a plain-text run. */
function renderEmphasis(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  for (const match of text.matchAll(EMPHASIS_PATTERN)) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="text-forest">
          {match[1]}
        </strong>,
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-i${i}`}>{match[2]}</em>);
    }
    lastIndex = match.index + match[0].length;
    i += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

/**
 * Render the inline-markdown convention: [label](href) links plus
 * **strong** / *em*. Internal hrefs go through the i18n Link so legal
 * cross-links keep the visitor's locale.
 */
function renderInline(text: string, keyPrefix = "t"): ReactNode[] {
  return parseInline(text).flatMap<ReactNode>((segment, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof segment === "string") {
      return renderEmphasis(segment, key);
    }
    if (segment.href.startsWith("/")) {
      return [
        <Link key={key} href={segment.href} className={linkClass}>
          {segment.label}
        </Link>,
      ];
    }
    const isExternal = segment.href.startsWith("http");
    return [
      <a
        key={key}
        href={segment.href}
        className={linkClass}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer nofollow" }
          : {})}
      >
        {segment.label}
      </a>,
    ];
  });
}

function LegalBlocks({ blocks, keyPrefix }: { blocks: LegalBlock[]; keyPrefix: string }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${keyPrefix}-${index}`;
        switch (block.kind) {
          case "paragraph":
            return (
              <p key={key} className={paragraph}>
                {renderInline(block.text, key)}
              </p>
            );
          case "list":
            return (
              <ul key={key} className={list}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            );
          case "lines":
            return (
              <p key={key} className={paragraph}>
                {block.lines.map((line, lineIndex) => (
                  <span key={`${key}-${lineIndex}`}>
                    {lineIndex > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            );
          case "details":
            return (
              <div key={key}>
                {block.items.map((item, itemIndex) => (
                  <div key={`${key}-${itemIndex}`}>
                    <p className="mt-4">
                      <span className={detailLabel}>{item.label}</span>
                    </p>
                    <p className="mt-2 text-base leading-relaxed text-ink/80">
                      {renderInline(item.value, `${key}-${itemIndex}`)}
                    </p>
                  </div>
                ))}
              </div>
            );
          case "note":
            return (
              <div key={key} role="note" className={`mt-6 ${noteBox}`}>
                {renderInline(block.text, key)}
              </div>
            );
          case "footnote":
            return (
              <p key={key} className="mt-10 text-sm leading-relaxed text-ink/60">
                {renderInline(block.text, key)}
              </p>
            );
        }
      })}
    </>
  );
}

export async function LegalPage({
  kind,
  locale,
}: {
  kind: LegalDocumentKind;
  locale: AppLocale;
}) {
  const doc = getLegalDocument(kind, locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: doc.breadcrumbLabel, href: `/${kind}` }]}
        eyebrow={t("eyebrow")}
        heading={doc.title}
        intro={doc.intro}
      />
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {locale !== "en" ? (
            /* Governing-language notice — non-English locales only. */
            <div
              role="note"
              className={`mb-6 flex items-start gap-3 ${noteBox}`}
            >
              <Languages
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
              />
              <p>
                <strong className="text-forest">{t("notice.title")}</strong>{" "}
                {t("notice.body")}
              </p>
            </div>
          ) : null}

          {doc.draftNote ? (
            <div
              role="note"
              className={`flex items-start gap-3 ${noteBox}`}
            >
              <ScrollText
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
              />
              <p>
                <strong className="text-forest">{t("draftBanner")}</strong>{" "}
                {renderInline(doc.draftNote, "draft")}
              </p>
            </div>
          ) : null}

          {doc.lastUpdated ? (
            <p className={paragraph}>
              {t("lastUpdated", {
                date: formatDate(doc.lastUpdated, locale),
              })}
            </p>
          ) : null}

          {doc.sections.map((section, index) => (
            <div key={section.heading}>
              <h2 className={sectionHeading}>{section.heading}</h2>
              <LegalBlocks blocks={section.blocks} keyPrefix={`s${index}`} />
            </div>
          ))}

          {doc.closing ? (
            <LegalBlocks blocks={doc.closing} keyPrefix="closing" />
          ) : null}
        </div>
      </section>
    </>
  );
}
