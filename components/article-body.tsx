import Link from "next/link";
import type { ReactNode } from "react";

import type { ArticleBlock } from "@/lib/content/blog";
import { parseInline } from "@/lib/content/inline";

function InlineText({ text }: { text: string }) {
  const segments = parseInline(text);
  return (
    <>
      {segments.map((segment, index) =>
        typeof segment === "string" ? (
          segment
        ) : (
          <Link
            key={index}
            href={segment.href}
            className="font-medium text-gold-deep underline underline-offset-2 hover:text-forest"
          >
            {segment.label}
          </Link>
        ),
      )}
    </>
  );
}

function renderBlock(block: ArticleBlock, index: number): ReactNode {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={index}
          className="mt-10 font-serif text-2xl font-semibold tracking-tight text-forest"
        >
          <InlineText text={block.text} />
        </h2>
      );
    case "h3":
      return (
        <h3
          key={index}
          className="mt-8 font-serif text-xl font-semibold text-forest"
        >
          <InlineText text={block.text} />
        </h3>
      );
    case "ul":
      return (
        <ul
          key={index}
          className="mt-5 list-disc space-y-2.5 pl-6 text-base leading-relaxed text-ink/80 marker:text-gold-deep"
        >
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote
          key={index}
          className="mt-6 border-l-4 border-gold pl-5 font-serif text-lg font-medium italic leading-relaxed text-forest"
        >
          <InlineText text={block.text} />
        </blockquote>
      );
    case "p":
    default:
      return (
        <p
          key={index}
          className="mt-5 text-base leading-relaxed text-ink/80"
        >
          <InlineText text={block.text} />
        </p>
      );
  }
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return <div className="max-w-none">{blocks.map(renderBlock)}</div>;
}
