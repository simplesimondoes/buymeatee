import "server-only";

import { isEmailConfigured } from "@/lib/email/config";
import { logEmailEvent } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/send";
import type { AppLocale } from "@/i18n/locales";
import {
  renderGiftReceivedEmail,
  renderGoalReachedEmail,
  type RenderedEmail,
} from "@/lib/email/templates";
import { getUserEmail, getUserEmailLocale } from "@/lib/email/user-email";
import { isSupportedCurrency } from "@/lib/payments/currency";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Notification delivery worker (ADR-013). Drains the creator-directed
 * `gift_notifications` queue (ADR-009) and sends each row via Resend. Delivery
 * is fully decoupled from webhook processing: a send failure never touches the
 * payment, and the (gift_id, type) unique constraint means the same
 * notification is enqueued at most once, however many times a webhook retries.
 *
 * Retry policy:
 *  - undeliverable (no recipient email, unknown type, render error) → "failed"
 *    (terminal; a human can inspect it)
 *  - transient provider failure → left "pending" for the next run
 */

const BATCH_SIZE = 50;

type PendingNotification = {
  id: string;
  recipient_user_id: string;
  type: string;
  payload: Record<string, unknown>;
};

export type DeliverySummary = {
  configured: boolean;
  scanned: number;
  sent: number;
  failed: number;
  retryable: number;
};

async function renderByType(
  notification: PendingNotification,
  locale: AppLocale,
): Promise<RenderedEmail | null> {
  const { payload } = notification;
  const currency = payload.currency;
  if (!isSupportedCurrency(currency)) {
    return null;
  }

  if (notification.type === "gift_received") {
    return renderGiftReceivedEmail({
      senderDisplayName: String(payload.senderDisplayName ?? ""),
      amount: Number(payload.giftAmount),
      currency,
      message:
        typeof payload.message === "string" ? payload.message : null,
      locale,
    });
  }

  if (notification.type === "goal_reached") {
    return renderGoalReachedEmail({
      goalTitle: String(payload.goalTitle ?? ""),
      raisedAmount: Number(payload.raisedAmount),
      targetAmount: Number(payload.targetAmount),
      currency,
      locale,
    });
  }

  return null;
}

export async function deliverPendingNotifications(): Promise<DeliverySummary> {
  const summary: DeliverySummary = {
    configured: isEmailConfigured(),
    scanned: 0,
    sent: 0,
    failed: 0,
    retryable: 0,
  };

  if (!summary.configured) {
    logEmailEvent("warn", "deliver.not_configured");
    return summary;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gift_notifications")
    .select("id, recipient_user_id, type, payload")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logEmailEvent("error", "deliver.query_failed", { reason: error.message });
    return summary;
  }

  const rows = (data ?? []) as PendingNotification[];
  summary.scanned = rows.length;

  for (const row of rows) {
    // Recipient language resolved at delivery time (ADR-019): a creator who
    // switches language gets subsequent emails in the new one.
    const locale = await getUserEmailLocale(row.recipient_user_id);
    const rendered = await renderByType(row, locale).catch(() => null);
    if (!rendered) {
      await markStatus(row.id, "failed");
      summary.failed += 1;
      logEmailEvent("error", "deliver.unrenderable", {
        notification_id: row.id,
        type: row.type,
      });
      continue;
    }

    const to = await getUserEmail(row.recipient_user_id);
    if (!to) {
      await markStatus(row.id, "failed");
      summary.failed += 1;
      logEmailEvent("error", "deliver.no_recipient_email", {
        notification_id: row.id,
        type: row.type,
      });
      continue;
    }

    const outcome = await sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      kind: row.type,
    });

    if (outcome === "sent") {
      await markStatus(row.id, "sent");
      summary.sent += 1;
    } else {
      // Leave "pending" so the next run retries a transient failure.
      summary.retryable += 1;
    }
  }

  logEmailEvent("info", "deliver.batch_complete", {
    scanned: summary.scanned,
    sent: summary.sent,
    failed: summary.failed,
    retryable: summary.retryable,
  });
  return summary;
}

async function markStatus(id: string, status: "sent" | "failed"): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const patch: { status: string; sent_at?: string } =
    status === "sent"
      ? { status, sent_at: new Date().toISOString() }
      : { status };
  const { error } = await supabase
    .from("gift_notifications")
    .update(patch)
    .eq("id", id);
  if (error) {
    logEmailEvent("error", "deliver.status_update_failed", {
      notification_id: id,
      status,
      reason: error.message,
    });
  }
}
