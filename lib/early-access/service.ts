import "server-only";

import type { EarlyAccessSubmission } from "@/lib/early-access/schema";

/**
 * Isolated submission service boundary (ADR-004).
 *
 * The provider is swappable: configure `EARLY_ACCESS_API_URL` (server-side
 * env var) to point at Formspree, Loops, ConvertKit, a Supabase function or
 * any endpoint accepting a JSON POST. With no endpoint configured we report
 * that honestly — success is never faked.
 *
 * Never log submitted personal data.
 */

export type SubmissionOutcome = "submitted" | "not-configured" | "failed";

export async function submitEarlyAccess(
  submission: EarlyAccessSubmission,
): Promise<SubmissionOutcome> {
  const endpoint = process.env.EARLY_ACCESS_API_URL;
  if (!endpoint) {
    return "not-configured";
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...submission,
        source: "buymeatee.com early-access form",
        submittedAt: new Date().toISOString(),
      }),
    });
    return response.ok ? "submitted" : "failed";
  } catch {
    // Deliberately no payload logging — the error cause is enough.
    console.error("Early-access submission to configured endpoint failed.");
    return "failed";
  }
}
