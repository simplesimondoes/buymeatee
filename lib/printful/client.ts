import "server-only";

import {
  getPrintfulConfig,
  isPrintfulConfigured,
  type PrintfulConfig,
} from "@/lib/printful/config";
import {
  PrintfulError,
  redactSecrets,
  type PrintfulRequestSummary,
} from "@/lib/printful/errors";
import type { PrintfulEnvelope } from "@/lib/printful/types";

/**
 * Core Printful API v1 client (ADR-024).
 *
 * Server-only. Owns authentication, timeouts, safe retries with backoff,
 * rate-limit handling, envelope unwrapping, structured errors, correlation ids
 * and secret redaction. Higher-level modules (catalogue/files/mockups/shipping/
 * orders) call request() and pass a parser for the `result`.
 *
 * The `fetchImpl` is injectable so tests drive the client without a network or
 * a live Printful account (spec §5, §37 — never create live orders in tests).
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_ATTEMPTS = 3;

export interface PrintfulRequestOptions<T> {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string; // e.g. "/orders" — leading slash, no base URL
  body?: unknown;
  /** Validates + normalises the envelope's `result`. */
  parse: (result: unknown) => T;
  /** Override retry behaviour (GET is retried; mutating calls opt in). */
  retry?: boolean;
  timeoutMs?: number;
  maxAttempts?: number;
  /** Optional store-id override; defaults to config.storeId. */
  storeId?: string | null;
}

export interface PrintfulClientDeps {
  config?: PrintfulConfig;
  fetchImpl?: typeof fetch;
  /** Injectable sleep so tests don't wait on real backoff. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable correlation-id source for deterministic tests. */
  correlationId?: () => string;
  /** Injectable logger; defaults to console. Only ever receives redacted text. */
  log?: (message: string) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function defaultCorrelationId(): string {
  // crypto.randomUUID is available in the Node/Edge runtimes the app targets.
  return globalThis.crypto?.randomUUID?.() ?? `pf_${Date.now()}`;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

/** Parse a Retry-After header (seconds or HTTP date) into a millisecond delay. */
function retryAfterMs(header: string | null): number | null {
  if (!header) {
    return null;
  }
  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && String(seconds) === header.trim()) {
    return Math.max(0, seconds * 1000);
  }
  const date = Date.parse(header);
  if (Number.isFinite(date)) {
    return Math.max(0, date - Date.now());
  }
  return null;
}

export class PrintfulClient {
  private readonly config: PrintfulConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly correlationId: () => string;
  private readonly log: (message: string) => void;

  constructor(deps: PrintfulClientDeps = {}) {
    this.config = deps.config ?? getPrintfulConfig();
    this.fetchImpl = deps.fetchImpl ?? fetch;
    this.sleep = deps.sleep ?? defaultSleep;
    this.correlationId = deps.correlationId ?? defaultCorrelationId;
    this.log = deps.log ?? ((m) => console.info(redactSecrets(m)));
  }

  private headers(storeId: string | null, hasBody: boolean): Headers {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${this.config.apiToken}`);
    headers.set("Accept", "application/json");
    if (hasBody) {
      headers.set("Content-Type", "application/json");
    }
    const effectiveStore = storeId ?? this.config.storeId;
    if (effectiveStore) {
      headers.set("X-PF-Store-Id", effectiveStore);
    }
    return headers;
  }

  async request<T>(options: PrintfulRequestOptions<T>): Promise<T> {
    const {
      method,
      path,
      body,
      parse,
      retry = method === "GET",
      timeoutMs = DEFAULT_TIMEOUT_MS,
      maxAttempts = DEFAULT_MAX_ATTEMPTS,
      storeId = null,
    } = options;

    const correlationId = this.correlationId();
    const summary: PrintfulRequestSummary = { method, path, correlationId };
    const url = `${this.config.baseUrl}${path}`;
    const hasBody = body !== undefined;
    const attempts = retry ? maxAttempts : 1;

    let lastError: PrintfulError | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers: this.headers(storeId, hasBody),
          body: hasBody ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timer);
        summary.status = response.status;

        const text = await response.text();
        const envelope = this.parseEnvelope(text, summary);

        if (!response.ok || envelope.code >= 400) {
          const retryable = isRetryableStatus(response.status);
          lastError = new PrintfulError(
            response.status === 429 ? "rate-limited" : "http",
            redactSecrets(
              envelope.error?.message ??
                envelope.error?.reason ??
                `Printful returned HTTP ${response.status}.`,
            ),
            { request: { ...summary }, printfulCode: envelope.code, retryable },
          );
          if (retryable && attempt < attempts) {
            await this.backoff(attempt, retryAfterMs(response.headers.get("Retry-After")));
            continue;
          }
          throw lastError;
        }

        return parse(envelope.result);
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof PrintfulError) {
          // Validation / already-structured HTTP error — only retry if flagged.
          if (error.retryable && attempt < attempts) {
            lastError = error;
            await this.backoff(attempt, null);
            continue;
          }
          throw error;
        }
        // Network failure or timeout (AbortError).
        const isAbort = (error as Error)?.name === "AbortError";
        lastError = new PrintfulError(
          isAbort ? "timeout" : "network",
          isAbort
            ? `Printful request timed out after ${timeoutMs}ms.`
            : redactSecrets(`Printful request failed: ${(error as Error)?.message ?? "unknown"}`),
          { request: { ...summary }, retryable: true, cause: error },
        );
        if (attempt < attempts) {
          await this.backoff(attempt, null);
          continue;
        }
        throw lastError;
      }
    }

    // Unreachable in practice; the loop either returns or throws.
    throw (
      lastError ??
      new PrintfulError("unexpected", "Printful request exhausted retries.", {
        request: summary,
      })
    );
  }

  private parseEnvelope(text: string, summary: PrintfulRequestSummary): PrintfulEnvelope<unknown> {
    if (text.trim() === "") {
      // Some Printful endpoints (e.g. confirm) may return an empty 2xx body.
      return { code: summary.status ?? 200, result: null };
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new PrintfulError("validation", "Printful returned non-JSON body.", {
        request: { ...summary },
      });
    }
    if (typeof json !== "object" || json === null) {
      throw new PrintfulError("validation", "Printful envelope was not an object.", {
        request: { ...summary },
      });
    }
    return json as PrintfulEnvelope<unknown>;
  }

  private async backoff(attempt: number, retryAfter: number | null): Promise<void> {
    // Honour Retry-After when Printful supplies it; otherwise exponential.
    const base = retryAfter ?? Math.min(2 ** (attempt - 1) * 500, 8_000);
    this.log(`printful retry attempt=${attempt} delayMs=${base}`);
    await this.sleep(base);
  }
}

/**
 * Build a client, or return null when Printful is unconfigured so callers can
 * fail safe (honest "unavailable") instead of throwing. Prefer this at any
 * boundary that must degrade gracefully.
 */
export function getPrintfulClientOrNull(deps: PrintfulClientDeps = {}): PrintfulClient | null {
  if (!deps.config && !isPrintfulConfigured()) {
    return null;
  }
  return new PrintfulClient(deps);
}
