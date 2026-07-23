import "server-only";

/**
 * Best-effort in-memory sliding-window rate limiter for sensitive endpoints
 * (Checkout Session creation, onboarding links).
 *
 * Limitation (documented in docs/stripe-connect-setup.md): on serverless
 * hosting each warm instance keeps its own window, so this caps abuse per
 * instance rather than globally. Server-side validation — not this limiter —
 * is the security boundary; swap in a shared store if abuse appears.
 */

const windows = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 10_000;

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const entries = (windows.get(key) ?? []).filter((at) => at > cutoff);
  if (entries.length >= limit) {
    windows.set(key, entries);
    return true;
  }
  entries.push(now);
  if (!windows.has(key) && windows.size >= MAX_TRACKED_KEYS) {
    windows.clear();
  }
  windows.set(key, entries);
  return false;
}

/** Coarse client key for anonymous callers: first forwarded IP or "unknown". */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
