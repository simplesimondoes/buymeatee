import "server-only";

/**
 * Structured, privacy-conscious email logging.
 *
 * Log only the email `kind`, an internal reference and the outcome — never
 * recipient addresses, subjects, rendered bodies or message content. This
 * mirrors lib/payments/log.ts so delivery is observable without leaking PII.
 */

type LogLevel = "info" | "warn" | "error";

export function logEmailEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const entry = JSON.stringify({
    source: "email",
    event,
    ...fields,
    at: new Date().toISOString(),
  });
  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.info(entry);
  }
}
