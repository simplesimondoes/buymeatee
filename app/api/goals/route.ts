import { NextResponse } from "next/server";

import { validateGoalInput } from "@/lib/goals/goal-schema";
import { createGoal } from "@/lib/goals/goals";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/** Creates a goal (always as a draft) for the signed-in creator. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Goals aren't available right now." },
      { status: 503 },
    );
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isRateLimited(`goals:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const payload = await request.json().catch(() => null);
  const validation = validateGoalInput(payload);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await createGoal(user.id, validation.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Saving isn't available right now. Please try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ goal: result.goal }, { status: 201 });
}
