import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { validateUpdateInput } from "@/lib/updates/update-schema";
import {
  deleteUpdate,
  editUpdate,
  setUpdateStatus,
  type UpdateMutationResult,
} from "@/lib/updates/updates";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Mutations for one of the signed-in creator's updates: edit content, publish
 * or unpublish (POST with an `action`), or delete (DELETE). Ownership is
 * enforced by the domain layer's creator_id filter plus RLS.
 */

const UUID = /^[0-9a-f-]{36}$/i;

function respond(result: UpdateMutationResult) {
  if (result.ok) {
    return NextResponse.json({ update: result.update });
  }
  if (result.reason === "not_found") {
    return apiError("api.updateNotFound", { status: 404 });
  }
  return apiError("api.updateSaveFailed", { status: 503 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ updateId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.updatesUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { updateId } = await params;
  if (!UUID.test(updateId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }
  if (isRateLimited(`update:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: string; title?: unknown; body?: unknown }
    | null;

  switch (body?.action) {
    case "edit": {
      const validation = validateUpdateInput(body);
      if (!validation.ok) {
        return apiError("api.checkFields", {
          status: 400,
          fields: validation.errors,
        });
      }
      return respond(await editUpdate(user.id, updateId, validation.data));
    }
    case "publish":
      return respond(await setUpdateStatus(user.id, updateId, "published"));
    case "unpublish":
      return respond(await setUpdateStatus(user.id, updateId, "draft"));
    default:
      return apiError("api.unknownAction", { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ updateId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return apiError("api.updatesUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  const { updateId } = await params;
  if (!UUID.test(updateId)) {
    return apiError("api.updateNotFound", { status: 404 });
  }

  const result = await deleteUpdate(user.id, updateId);
  if (!result.ok) {
    return apiError("api.updateDeleteFailed", { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
