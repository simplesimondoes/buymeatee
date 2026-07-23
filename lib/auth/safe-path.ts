/**
 * Sanitise a post-auth redirect target. Only same-site relative paths are
 * allowed — anything else falls back — which rules out open redirects in
 * auth callback and sign-in flows.
 */
export function safeRelativePath(
  candidate: unknown,
  fallback: string = "/dashboard",
): string {
  if (
    typeof candidate === "string" &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.includes("\\") &&
    !candidate.includes("\n") &&
    !candidate.includes("\r")
  ) {
    return candidate;
  }
  return fallback;
}
