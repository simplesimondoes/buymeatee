"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { isErrorDetail, type ErrorDetail } from "@/lib/i18n/errors";

/**
 * Turn an error payload into a localized message. Accepts:
 * - an ErrorDetail ({ code, params }) from schemas or API responses,
 * - a legacy raw string (rendered as-is — transitional),
 * - anything else → the translated generic message.
 * Unknown codes fall back to the generic message rather than leaking keys.
 */
export function useErrorMessage() {
  const t = useTranslations("errors");

  return useCallback(
    (error: ErrorDetail | string | null | undefined): string => {
      if (!error) return t("generic");
      if (typeof error === "string") return error;
      if (isErrorDetail(error) && t.has(error.code as never)) {
        return t(error.code as never, error.params as never);
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn("[i18n] unmapped error code:", error);
      }
      return t("generic");
    },
    [t],
  );
}
