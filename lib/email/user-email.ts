import "server-only";

import { logEmailEvent } from "@/lib/email/log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve a user's email address. Emails live in `auth.users`, not the public
 * `profiles` table, so this needs the service-role admin client. Returns null
 * (never throws) when the user is missing or has no email — callers treat a
 * missing address as an undeliverable notification, not an error.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) {
      return null;
    }
    return data.user.email;
  } catch (cause) {
    logEmailEvent("error", "email.lookup_failed", {
      user_id: userId,
      reason: cause instanceof Error ? cause.message : "unknown",
    });
    return null;
  }
}
