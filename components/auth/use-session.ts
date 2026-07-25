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
      /** True when the user is in admin_users (self-read RLS policy). Link
       *  visibility only — every /admin route re-checks server-side. */
      isAdmin: boolean;
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
      // RLS lets a signed-in user read their own profile row and check their
      // own admin_users membership — nothing about anyone else.
      const [profileResult, adminResult] = await Promise.all([
        supabase!
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase!
          .from("admin_users")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (active) {
        setState({
          status: "authed",
          username: profileResult.data?.username ?? null,
          displayName: profileResult.data?.display_name ?? null,
          avatarUrl: profileResult.data?.avatar_url ?? null,
          isAdmin: Boolean(adminResult.data),
        });
      }
    }

    const pending: SessionState = {
      status: "authed",
      username: null,
      displayName: null,
      avatarUrl: null,
      isAdmin: false,
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
