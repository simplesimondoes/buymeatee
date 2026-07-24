import "server-only";

import { UPDATE_COLUMNS, type CreatorUpdateRow } from "@/lib/updates/types";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";

/**
 * Public reads of a creator's published updates. On the anonymous client:
 * the RLS policy ("published updates of an active creator are viewable by
 * everyone") is what keeps drafts and deactivated creators' updates invisible
 * — the status filter below only shapes ordering within what RLS exposes.
 */

const UPDATES_SHOWN = 20;

export async function getPublishedUpdatesForCreator(
  creatorId: string,
): Promise<CreatorUpdateRow[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("creator_updates")
    .select(UPDATE_COLUMNS)
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(UPDATES_SHOWN);
  if (error) {
    throw new Error(`Failed to load updates: ${error.message}`);
  }
  return (data as CreatorUpdateRow[]) ?? [];
}
