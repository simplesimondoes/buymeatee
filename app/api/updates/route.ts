import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
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
    return apiError("api.updatesUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`update:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const validation = validateUpdateInput(payload);
  if (!validation.ok) {
    return apiError("api.checkFields", {
      status: 400,
      fields: validation.errors,
    });
  }

  const result = await createUpdate(user.id, validation.data);
  if (!result.ok) {
    return apiError("api.updateSaveFailed", { status: 503 });
  }
  return NextResponse.json({ update: result.update });
}
