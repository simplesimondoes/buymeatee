import { NextResponse } from "next/server";

import {
  clearProfileBio,
  removeProfileAvatar,
  restoreGoal,
  takeDownGoal,
} from "@/lib/admin/moderation";
import type { AdminUserMutationResult } from "@/lib/admin/users";
import { apiError } from "@/lib/api/errors";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Item-level moderation actions. Admin-only (server-checked); every action
 * requires a reason, which lands in the append-only audit log.
 *
 *   POST { action: "goal_take_down" | "goal_restore", goalId, reason }
 *   POST { action: "clear_bio" | "remove_avatar", userId, reason }
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user.id))) {
    return apiError("api.notAuthorised", { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as {
    action?: unknown;
    goalId?: unknown;
    userId?: unknown;
    reason?: unknown;
  } | null;
  const reason = typeof payload?.reason === "string" ? payload.reason.trim() : "";
  if (reason.length < 1 || reason.length > 500) {
    return apiError("api.adminReasonRequired", {
      status: 400,
      params: { max: 500 },
    });
  }

  const goalId = typeof payload?.goalId === "string" ? payload.goalId : "";
  const userId = typeof payload?.userId === "string" ? payload.userId : "";
  const uuid = /^[0-9a-f-]{36}$/i;

  let result: AdminUserMutationResult;
  switch (payload?.action) {
    case "goal_take_down":
    case "goal_restore": {
      if (!uuid.test(goalId)) {
        return apiError("api.goalUnknown", { status: 400 });
      }
      result =
        payload.action === "goal_take_down"
          ? await takeDownGoal(user.id, goalId, reason)
          : await restoreGoal(user.id, goalId, reason);
      break;
    }
    case "clear_bio":
    case "remove_avatar": {
      if (!uuid.test(userId)) {
        return apiError("api.unknownUser", { status: 400 });
      }
      result =
        payload.action === "clear_bio"
          ? await clearProfileBio(user.id, userId, reason)
          : await removeProfileAvatar(user.id, userId, reason);
      break;
    }
    default:
      return apiError("api.unknownAction", { status: 400 });
  }

  if (!result.ok) {
    if (result.reason === "not_found") {
      return apiError("api.notFound", { status: 404 });
    }
    if (result.reason === "no_change") {
      return apiError("api.alreadyInState", { status: 409 });
    }
    return apiError("api.unavailable", { status: 503 });
  }
  return NextResponse.json({ done: true });
}
