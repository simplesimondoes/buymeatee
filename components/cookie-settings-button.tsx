"use client";

import { useTranslations } from "next-intl";

import { openCookieSettings } from "@/lib/cookie-consent";

/** Footer control to reopen the cookie banner and change or withdraw consent. */
export function CookieSettingsButton() {
  const t = useTranslations("common");
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="text-xs text-white/60 underline-offset-2 transition-colors hover:text-white hover:underline"
    >
      {t("cookies.settings")}
    </button>
  );
}
