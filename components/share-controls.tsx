"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Creator-initiated sharing. Never posts on anyone's behalf: "Post to X" opens
 * X's compose window with the text pre-filled so the creator reviews and sends
 * it themselves; native share and copy-link are equally opt-in. No X API, no
 * automation, no supporter data leaves the page.
 */

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Standard X web-intent compose link — pre-fills, never sends. */
function xIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function ShareControls({
  url,
  text,
  showCopy = true,
  buttonLabel = "Share",
  align = "left",
  size = "sm",
}: {
  /** Absolute, canonical URL to share (e.g. https://buymeatee.com/t/name). */
  url: string;
  /** Pre-composed post text. The URL is attached separately, not embedded. */
  text: string;
  showCopy?: boolean;
  buttonLabel?: string;
  align?: "left" | "right";
  /** "sm" for dense action rows; "md" to sit beside full-height buttons. */
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // A share panel is a menu: dismiss on outside click or Escape.
  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function copyLink() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      return;
    }
    try {
      await navigator.share({ text, url });
      setOpen(false);
    } catch {
      // Cancelled or unsupported target: leave the panel open for a fallback.
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/80 transition-colors hover:bg-mist";

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-stone font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest ${
          size === "md" ? "min-h-11 px-5 text-sm" : "min-h-9 px-4 text-xs"
        }`}
      >
        <Share2 aria-hidden="true" className="h-4 w-4" />
        {buttonLabel}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-10 mt-2 w-52 rounded-2xl border border-stone bg-white p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <a
            role="menuitem"
            href={xIntentUrl(text, url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <XLogo className="h-4 w-4" />
            Post to X
          </a>
          {showCopy ? (
            <button
              type="button"
              role="menuitem"
              onClick={copyLink}
              className={itemClass}
            >
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4 text-forest" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? "Link copied" : "Copy link"}
            </button>
          ) : null}
          {canNativeShare ? (
            <button
              type="button"
              role="menuitem"
              onClick={nativeShare}
              className={itemClass}
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
              More options…
            </button>
          ) : null}
          {copyFailed ? (
            <p className="px-3 py-1 text-xs text-ink/60">
              Copying isn&apos;t available — select the link by hand.
            </p>
          ) : null}
        </div>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
