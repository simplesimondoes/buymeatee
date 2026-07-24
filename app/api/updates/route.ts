import { NextResponse } from "next/server";

import { validateUpdateInput } from "@/lib/updates/update-schema";
import { createUpdate } from "@/lib/updates/updates";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Creates a project update (as a draft) for the signed-in creator. Validation
 * is authoritative here; RLS and column grants are the final layer.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Updates aren't available right now." },
      { status: 503 },
    );
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isRateLimited(`update:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const payload = await request.json().catch(() => null);
  const validation = validateUpdateInput(payload);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await createUpdate(user.id, validation.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Couldn't save your update. Please try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ update: result.update });
}
