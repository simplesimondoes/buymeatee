"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Client-side view of the visitor's auth state, for site chrome only.
 *
 * The header lives in the root layout, which must stay statically generated
 * (ADR-010) — so it cannot read the session cookie on the server. This hook
 * resolves the session in the browser instead: the static HTML ships the
 * signed-out chrome, then this upgrades it once hydrated. Authorisation still
 * happens server-side on every protected route; this only decides which links
 * to show.
 */
export type SessionState =
  | { status: "loading" }
  | { status: "anon" }
  | {
      status: "authed";
      username: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };

// Deterministic on both server and client — NEXT_PUBLIC_* values are inlined at
// build time, so this keeps the initial render free of hydration mismatch.
const configured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function useSession(): SessionState {
  // While configured, we don't yet know if the visitor is signed in, so start
  // "loading" (rendered as signed-out chrome) and resolve in the effect below.
  const [state, setState] = useState<SessionState>(
    configured ? { status: "loading" } : { status: "anon" },
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    async function resolveProfile(userId: string) {
      // RLS lets a signed-in user read their own profile row.
      const { data } = await supabase!
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (active) {
        setState({
          status: "authed",
          username: data?.username ?? null,
          displayName: data?.display_name ?? null,
          avatarUrl: data?.avatar_url ?? null,
        });
      }
    }

    const pending: SessionState = {
      status: "authed",
      username: null,
      displayName: null,
      avatarUrl: null,
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        setState(pending);
        void resolveProfile(data.user.id);
      } else {
        setState({ status: "anon" });
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
        if (session?.user) {
          setState(pending);
          void resolveProfile(session.user.id);
        } else {
          setState({ status: "anon" });
        }
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
