import "server-only";

import type { UpdateInput } from "@/lib/updates/update-schema";
import {
  UPDATE_COLUMNS,
  type CreatorUpdateRow,
  type UpdateStatus,
} from "@/lib/updates/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Project update reads and mutations for the update's owner. Everything runs
 * on the session client — RLS confines each operation to the caller's own
 * updates, and column grants keep id/timestamps server-owned (mirrors
 * lib/goals/goals.ts).
 */

export type UpdateMutationResult =
  | { ok: true; update: CreatorUpdateRow }
  | { ok: false; reason: "not_found" | "unavailable" };

export async function getOwnUpdates(
  userId: string,
): Promise<CreatorUpdateRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_updates")
    .select(UPDATE_COLUMNS)
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load updates: ${error.message}`);
  }
  return (data as CreatorUpdateRow[]) ?? [];
}

async function getOwnUpdate(
  userId: string,
  updateId: string,
): Promise<CreatorUpdateRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("creator_updates")
    .select(UPDATE_COLUMNS)
    .eq("creator_id", userId)
    .eq("id", updateId)
    .maybeSingle();
  return (data as CreatorUpdateRow | null) ?? null;
}

export async function createUpdate(
  userId: string,
  input: UpdateInput,
): Promise<UpdateMutationResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("creator_updates")
      .insert({
        creator_id: userId,
        title: input.title,
        body: input.body,
        status: "draft",
      })
      .select(UPDATE_COLUMNS)
      .single();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, update: data as CreatorUpdateRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function editUpdate(
  userId: string,
  updateId: string,
  input: UpdateInput,
): Promise<UpdateMutationResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("creator_updates")
      .update({ title: input.title, body: input.body })
      .eq("creator_id", userId)
      .eq("id", updateId)
      .select(UPDATE_COLUMNS)
      .maybeSingle();
    if (error) {
      return { ok: false, reason: "unavailable" };
    }
    if (!data) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: true, update: data as CreatorUpdateRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function setUpdateStatus(
  userId: string,
  updateId: string,
  status: UpdateStatus,
): Promise<UpdateMutationResult> {
  try {
    const existing = await getOwnUpdate(userId, updateId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    const patch: { status: UpdateStatus; published_at?: string } = { status };
    // First publish stamps published_at (feed ordering); it's kept across an
    // unpublish/re-publish so the original date stands.
    if (status === "published" && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("creator_updates")
      .update(patch)
      .eq("creator_id", userId)
      .eq("id", updateId)
      .select(UPDATE_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, update: data as CreatorUpdateRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function deleteUpdate(
  userId: string,
  updateId: string,
): Promise<{ ok: boolean }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("creator_updates")
      .delete()
      .eq("creator_id", userId)
      .eq("id", updateId);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
