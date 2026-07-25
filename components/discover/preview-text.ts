import { useTranslations } from "next-intl";

/**
 * Resolves Discover card text fields. Preview cards (ADR-007) carry
 * `content`-namespace message keys in their text fields; real cards carry
 * user-generated strings that must never be translated. Works in both server
 * and client components (next-intl's `useTranslations` supports both).
 */
export function usePreviewText(isPreview: boolean) {
  const t = useTranslations("content");
  return function text<T extends string | null>(value: T): string | T {
    return isPreview && value ? t(value as never) : value;
  };
}
