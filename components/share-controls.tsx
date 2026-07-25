"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { ShareMessage } from "@/lib/goals/share";

/**
 * Creator-initiated sharing. Never posts on anyone's behalf: "Post to X" opens
 * X's compose window with the text pre-filled so the creator reviews and sends
 * it themselves; native share and copy-link are equally opt-in. No X API, no
 * automation, no supporter data leaves the page.
 *
 * Needs the `gifts` message namespace (share.* keys) — wrap usage in
 * <ClientMessages namespaces={["gifts", …]}>. Share copy arrives as a pure
 * ShareMessage (lib/goals/share.ts picks the honest variant) and is rendered
 * here in the creator's language; goal/item titles stay verbatim.
 */

export function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function BlueskyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 10.8C10.9 8.6 7.9 4.5 5.1 2.6 2.4.8 1.4 1.1.7 1.4 0 1.7 0 2.9 0 3.6c0 .7.4 5.5.6 6.3.8 2.6 3.5 3.5 6 3.2-3.7.5-7 1.9-2.7 6.7 4.8 4.9 6.6-1 7.5-3.9.9 2.9 2 8.6 7.4 3.9 4-3.9.8-6.2-2.9-6.7 2.5.3 5.2-.6 6-3.2.2-.8.6-5.6.6-6.3 0-.7 0-1.9-.7-2.2-.7-.3-1.7-.6-4.4 1.2C16.1 4.5 13.1 8.6 12 10.8z" />
    </svg>
  );
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.4 3H3.6C3 3 2.5 3.5 2.5 4.1v15.8c0 .6.5 1.1 1.1 1.1h16.8c.6 0 1.1-.5 1.1-1.1V4.1c0-.6-.5-1.1-1.1-1.1zM8.3 18.3H5.5V9.5h2.8zM6.9 8.3a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm11.4 10h-2.8v-4.3c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.3v4.3H9.7V9.5h2.7v1.2h.04c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.3z" />
    </svg>
  );
}

function WhatsappLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1.1 2.7c.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.3-.2z" />
    </svg>
  );
}

type ShareChannel = {
  key: string;
  labelKey: "postToX" | "bluesky" | "whatsapp" | "facebook" | "linkedin";
  href: string;
  Icon: typeof XLogo;
};

/**
 * Web-intent share links for the platforms golfers actually use. Each one
 * pre-fills a compose window; the creator reviews and posts it themselves. X
 * and Bluesky carry the full message; Facebook and LinkedIn only accept a URL
 * (they build the preview from the page's Open Graph card), so the pre-filled
 * text is dropped there by the platform, not by us.
 */
function shareChannels(text: string, url: string): ShareChannel[] {
  const enc = encodeURIComponent;
  const textThenUrl = `${text}\n\n${url}`;
  return [
    {
      key: "x",
      labelKey: "postToX",
      href: `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url }).toString()}`,
      Icon: XLogo,
    },
    {
      key: "bluesky",
      labelKey: "bluesky",
      href: `https://bsky.app/intent/compose?text=${enc(textThenUrl)}`,
      Icon: BlueskyLogo,
    },
    {
      key: "whatsapp",
      labelKey: "whatsapp",
      href: `https://wa.me/?text=${enc(`${text} ${url}`)}`,
      Icon: WhatsappLogo,
    },
    {
      key: "facebook",
      labelKey: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      Icon: FacebookLogo,
    },
    {
      key: "linkedin",
      labelKey: "linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      Icon: LinkedInLogo,
    },
  ];
}

export function ShareControls({
  url,
  text,
  showCopy = true,
  buttonLabel,
  align = "left",
  size = "sm",
}: {
  /** Absolute, canonical URL to share (e.g. https://buymeatee.com/t/name). */
  url: string;
  /**
   * Post copy: a ShareMessage (translated here) or a pre-composed string.
   * The URL is attached separately, not embedded.
   */
  text: string | ShareMessage;
  showCopy?: boolean;
  buttonLabel?: string;
  align?: "left" | "right";
  /** "sm" for dense action rows; "md" to sit beside full-height buttons. */
  size?: "sm" | "md";
}) {
  const t = useTranslations("gifts.share");
  const shareText =
    typeof text === "string"
      ? text
      : t(text.key as never, text.params as never);
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
      await navigator.share({ text: shareText, url });
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
        {buttonLabel ?? t("button")}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-10 mt-2 w-52 rounded-2xl border border-stone bg-white p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {shareChannels(shareText, url).map(({ key, labelKey, href, Icon }) => (
            <a
              key={key}
              role="menuitem"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </a>
          ))}
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
              {copied ? t("linkCopied") : t("copyLink")}
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
              {t("moreOptions")}
            </button>
          ) : null}
          {copyFailed ? (
            <p className="px-3 py-1 text-xs text-ink/60">{t("copyFailed")}</p>
          ) : null}
        </div>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {copied ? t("copiedAnnouncement") : ""}
      </span>
    </div>
  );
}
