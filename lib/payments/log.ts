import "server-only";

/**
 * Structured, privacy-conscious payment logging.
 *
 * Only internal references and Stripe object ids — never secret keys, full
 * payloads, bank details, card details, email addresses or message content.
 */

type LogLevel = "info" | "warn" | "error";

export function logPaymentEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const entry = JSON.stringify({
    source: "payments",
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
