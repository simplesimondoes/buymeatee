import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { errorDetail } from "@/lib/i18n/errors";
import { validateGoalInput } from "@/lib/goals/goal-schema";
import { createGoal } from "@/lib/goals/goals";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/** Creates a goal (always as a draft) for the signed-in creator. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("api.goalsUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`goals:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const validation = validateGoalInput(payload);
  if (!validation.ok) {
    return apiError("api.checkFields", {
      status: 400,
      fields: validation.errors,
    });
  }

  const result = await createGoal(user.id, validation.data);
  if (!result.ok) {
    if (result.reason === "currency_mismatch") {
      return apiError("api.goalPayoutCurrency", {
        status: 409,
        fields: { currency: errorDetail("api.goalPayoutCurrency") },
      });
    }
    return apiError("api.savingUnavailable", { status: 503 });
  }
  return NextResponse.json({ goal: result.goal }, { status: 201 });
}
