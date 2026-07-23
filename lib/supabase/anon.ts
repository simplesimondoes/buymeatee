import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous (signed-out) Supabase client for server-side reads of public
 * data. Runs with the anon key and NO user session, so RLS public-read
 * policies are the enforcement layer — exactly what a stranger could see.
 * Use this instead of the admin client whenever "public" is the contract.
 */

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAnonClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
