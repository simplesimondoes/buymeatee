import "server-only";

import { Resend } from "resend";

import { getEmailConfig } from "@/lib/email/config";
import { logEmailEvent } from "@/lib/email/log";

/**
 * The single email delivery primitive. Every platform email goes through
 * here so provider details, honest "not-configured" handling and
 * privacy-conscious logging live in one place.
 *
 *  - "sent"           the provider accepted the message
 *  - "not-configured" no RESEND_API_KEY / EMAIL_FROM — nothing was sent
 *  - "failed"         the provider rejected it or threw
 *
 * Never throws: a delivery problem must never take down the caller (a
 * webhook, a form submission, a cron worker).
 */
export type EmailOutcome = "sent" | "not-configured" | "failed";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * Short kind used only for logging (e.g. "gift_received"). Never contains
   * PII, so it is safe to record.
   */
  kind: string;
};

let cachedClient: Resend | null = null;

function getClient(apiKey: string): Resend {
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

export async function sendEmail(message: EmailMessage): Promise<EmailOutcome> {
  const config = getEmailConfig();
  if (!config) {
    logEmailEvent("warn", "email.not_configured", { kind: message.kind });
    return "not-configured";
  }

  try {
    const client = getClient(config.apiKey);
    const { error } = await client.emails.send({
      from: config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(config.replyTo ? { replyTo: config.replyTo } : {}),
    });

    if (error) {
      logEmailEvent("error", "email.send_failed", {
        kind: message.kind,
        reason: error.message,
      });
      return "failed";
    }

    logEmailEvent("info", "email.sent", { kind: message.kind });
    return "sent";
  } catch (cause) {
    // No payload logging — the reason is enough, and must never carry PII.
    logEmailEvent("error", "email.send_threw", {
      kind: message.kind,
      reason: cause instanceof Error ? cause.message : "unknown",
    });
    return "failed";
  }
}
