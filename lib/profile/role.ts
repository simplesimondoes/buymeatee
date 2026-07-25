import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Promote a profile to the creator role the first time the user does
 * something only a creator does (creates a goal or wish-list item, starts
 * Stripe onboarding). The magic-link sign-in never sets role metadata, so
 * without this every account stays at the DB default 'supporter' and the
 * creator/supporter split (admin views, analytics) is meaningless.
 *
 * Best-effort and idempotent: the role is a descriptive label, not an
 * authorisation input, so a failure here must never block the creator
 * action that triggered it. Never demotes.
 */
export async function markProfileAsCreator(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from("profiles")
      .update({ role: "creator" })
      .eq("id", userId)
      .eq("role", "supporter");
  } catch {
    // Best-effort by design (see above).
  }
}
