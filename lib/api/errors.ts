import { NextResponse } from "next/server";

import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";

/**
 * Standard error response for API route handlers (ADR-019): a stable code
 * plus optional ICU params, rendered into the visitor's language by the
 * client (useErrorMessage). Never put raw provider errors in here — log
 * them server-side instead.
 *
 * Shape: { error: { code, params? }, errors?: { field: { code, params? } } }
 */
export function apiError(
  code: string,
  options: {
    status?: number;
    params?: Record<string, string | number>;
    /** Per-field validation details, e.g. a schema's error map. */
    fields?: Record<string, ErrorDetail>;
  } = {},
): NextResponse {
  const { status = 400, params, fields } = options;
  return NextResponse.json(
    {
      error: errorDetail(code, params),
      ...(fields ? { errors: fields } : {}),
    },
    { status },
  );
}
