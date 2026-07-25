import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { isSocialStudioConfigured } from "@/lib/social-studio/generate";
import { seedCalendar } from "@/lib/social-studio/drafts";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

// Seeding a week means up to 14 AI generations — allow the route time on
// deployments that support it (the client seeds week-by-week regardless).
export const maxDuration = 300;

/**
 * Seeds the rolling content calendar (ADR-023). Owner-only — the same email
 * gate as /admin/analytics. The client calls this once per week-window so no
 * single request has to generate the whole four-week calendar.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("api.unavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user || !canViewAnalytics(user.email)) {
    return apiError("api.notAuthorised", { status: 404 });
  }
  if (!isSocialStudioConfigured()) {
    return apiError("api.unavailable", { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    offsetDays?: unknown;
    days?: unknown;
  };
  const offsetDays = clampInt(payload.offsetDays, 0, 56, 0);
  const days = clampInt(payload.days, 1, 28, 7);

  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() + offsetDays);

  try {
    const result = await seedCalendar({ from, days });
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "social seed failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return apiError("api.unavailable", { status: 503 });
  }
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = typeof value === "number" ? Math.floor(value) : NaN;
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}
