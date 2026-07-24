import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * Renders creator-authored markdown (About sections, Updates) — ADR-014.
 *
 * Security: the source is arbitrary user input, so it goes through
 * rehype-sanitize (default safe schema) BEFORE rendering — no raw HTML,
 * scripts, event handlers or javascript: URLs survive. remark-gfm adds the
 * "full" formatting (tables, task lists, strikethrough, autolinks). Element
 * styling is applied by our own components, never from the input.
 *
 * Live third-party embeds (YouTube/Instagram) are deliberately NOT handled
 * here — they are a separate structured "Pinned Media" feature with hardened
 * iframes, kept out of the markdown path so this stays a closed, safe subset.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          h1: ({ children }) => (
            <h2 className="mt-2 font-serif text-2xl font-semibold text-forest">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="mt-2 font-serif text-xl font-semibold text-forest">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-2 font-serif text-lg font-semibold text-forest">
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-medium text-forest underline underline-offset-2 hover:text-forest-dark"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-gold pl-4 italic text-ink/70">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-sm text-ink">
              {children}
            </code>
          ),
          hr: () => <hr className="border-stone" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-stone bg-mist px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-stone px-3 py-2">{children}</td>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
