/**
 * Minimal inline-link parsing for typed article content.
 * Supports markdown-style links: "read [the FAQ](/faq) for more".
 */

export type InlineSegment = string | { label: string; href: string };

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    segments.push({ label: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }
  return segments;
}

/** Plain-text version (for word counts and descriptions). */
export function stripInline(text: string): string {
  return text.replace(LINK_PATTERN, "$1");
}
