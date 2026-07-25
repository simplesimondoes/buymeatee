import { NextResponse } from "next/server";

import { deactivateUser, reinstateUser } from "@/lib/admin/users";
import { apiError } from "@/lib/api/errors";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Deactivate or reinstate a profile. Admin-only (server-checked); every
 * action requires a reason, which lands in the append-only audit log.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user.id))) {
    return apiError("api.notAuthorised", { status: 403 });
  }

  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return apiError("api.unknownUser", { status: 400 });
  }
  if (userId === user.id) {
    return apiError("api.adminSelfDeactivate", { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as {
    action?: unknown;
    reason?: unknown;
  } | null;
  const action = payload?.action;
  const reason = typeof payload?.reason === "string" ? payload.reason.trim() : "";
  if (action !== "deactivate" && action !== "reinstate") {
    return apiError("api.unknownAction", { status: 400 });
  }
  if (reason.length < 1 || reason.length > 500) {
    return apiError("api.adminReasonRequired", {
      status: 400,
      params: { max: 500 },
    });
  }

  const result =
    action === "deactivate"
      ? await deactivateUser(user.id, userId, reason)
      : await reinstateUser(user.id, userId, reason);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return apiError("api.unknownUser", { status: 404 });
    }
    if (result.reason === "no_change") {
      return apiError("api.alreadyInState", { status: 409 });
    }
    return apiError("api.unavailable", { status: 503 });
  }
  return NextResponse.json({ done: true });
}
