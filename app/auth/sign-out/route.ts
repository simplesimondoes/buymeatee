import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", new URL(request.url).origin), {
    status: 303,
  });
}
