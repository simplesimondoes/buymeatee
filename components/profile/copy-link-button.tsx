"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Copies the creator's public page URL, announcing the result politely. */
export function CopyLinkButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/t/${username}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the visible link stays selectable by hand.
      setFailed(true);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
      >
        {copied ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Copy aria-hidden="true" className="h-4 w-4" />
        )}
        {copied ? "Copied" : "Copy your link"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
      {failed ? (
        <span className="text-xs text-ink/60">
          Copying isn&apos;t available — select the link text instead.
        </span>
      ) : null}
    </span>
  );
}
