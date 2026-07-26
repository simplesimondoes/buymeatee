/**
 * Structured Printful client errors (Printful merch MVP, ADR-024).
 *
 * Pure module (no server-only) so error shapes can be asserted in tests. Errors
 * NEVER carry the API token or any secret — only a redacted request summary.
 */

export type PrintfulErrorKind =
  | "not-configured" // env not set — Printful is unavailable, fail safe
  | "network" // fetch threw / timed out
  | "timeout"
  | "rate-limited" // 429 after retries
  | "http" // non-2xx envelope
  | "validation" // response didn't match the expected shape
  | "unexpected";

export interface PrintfulRequestSummary {
  method: string;
  /** Path only (never the token). */
  path: string;
  /** Correlation id echoed in logs so a request can be traced end to end. */
  correlationId: string;
  /** HTTP status, when a response was received. */
  status?: number;
}

export class PrintfulError extends Error {
  readonly kind: PrintfulErrorKind;
  readonly request?: PrintfulRequestSummary;
  /** Printful's own error code from the envelope, when present. */
  readonly printfulCode?: number;
  /** True when a retry could plausibly succeed (network/timeout/429/5xx). */
  readonly retryable: boolean;

  constructor(
    kind: PrintfulErrorKind,
    message: string,
    options: {
      request?: PrintfulRequestSummary;
      printfulCode?: number;
      retryable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "PrintfulError";
    this.kind = kind;
    this.request = options.request;
    this.printfulCode = options.printfulCode;
    this.retryable = options.retryable ?? false;
  }
}

/**
 * Remove anything secret-looking from a string before it reaches a log or an
 * error message. Defence in depth: the client already never puts the token in
 * a message, but user-supplied URLs or echoed payloads might.
 */
export function redactSecrets(input: string): string {
  return input
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .replace(/([?&](?:token|api_key|apikey|access_token)=)[^&\s]+/gi, "$1[redacted]");
}
