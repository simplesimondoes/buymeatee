import { NextResponse } from "next/server";

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
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }
  return NextResponse.json(
    { error: "Couldn't save your update. Please try again." },
    { status: 503 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ updateId: string }> },
) {
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
  const { updateId } = await params;
  if (!UUID.test(updateId)) {
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }
  if (isRateLimited(`update:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: string; title?: unknown; body?: unknown }
    | null;

  switch (body?.action) {
    case "edit": {
      const validation = validateUpdateInput(body);
      if (!validation.ok) {
        return NextResponse.json({ errors: validation.errors }, { status: 400 });
      }
      return respond(await editUpdate(user.id, updateId, validation.data));
    }
    case "publish":
      return respond(await setUpdateStatus(user.id, updateId, "published"));
    case "unpublish":
      return respond(await setUpdateStatus(user.id, updateId, "draft"));
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ updateId: string }> },
) {
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
  const { updateId } = await params;
  if (!UUID.test(updateId)) {
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }

  const result = await deleteUpdate(user.id, updateId);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Couldn't delete the update. Please try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}
