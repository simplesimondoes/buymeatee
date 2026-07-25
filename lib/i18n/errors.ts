/**
 * Stable error codes (ADR-019).
 *
 * Schemas and API routes never produce English sentences — they carry a
 * code (a dot path into the `errors` message namespace) plus optional ICU
 * params. Only the rendering edge (client hook useErrorMessage, or a server
 * translator) turns codes into language. Raw Stripe/Supabase errors are
 * logged server-side and never surfaced.
 *
 * Pure module: no server-only, no React — usable from schemas (shared
 * client+server), routes and tests.
 */

import enErrors from "@/messages/en/errors.json";

export type ErrorDetail = {
  /** Dot path inside the `errors` namespace, e.g. "api.signInRequired". */
  code: string;
  params?: Record<string, string | number>;
};

export function errorDetail(
  code: string,
  params?: Record<string, string | number>,
): ErrorDetail {
  return params ? { code, params } : { code };
}

export function isErrorDetail(value: unknown): value is ErrorDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string"
  );
}

function lookupEnglish(code: string): string | null {
  let node: unknown = enErrors;
  for (const part of code.split(".")) {
    if (typeof node !== "object" || node === null) return null;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : null;
}

/**
 * English rendering without request context — for logs, tests and any
 * server path that has no locale. Interpolates {param} placeholders.
 */
export function fallbackErrorText(detail: ErrorDetail | string): string {
  if (typeof detail === "string") return detail;
  const template = lookupEnglish(detail.code);
  if (!template) return lookupEnglish("generic") ?? "Something went wrong.";
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = detail.params?.[name];
    return value === undefined ? match : String(value);
  });
}
