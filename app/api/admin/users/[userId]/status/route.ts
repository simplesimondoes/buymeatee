import { NextResponse } from "next/server";

import { deactivateUser, reinstateUser } from "@/lib/admin/users";
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
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "Unknown user." }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json(
      { error: "You can't deactivate your own account." },
      { status: 400 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    action?: unknown;
    reason?: unknown;
  } | null;
  const action = payload?.action;
  const reason = typeof payload?.reason === "string" ? payload.reason.trim() : "";
  if (action !== "deactivate" && action !== "reinstate") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (reason.length < 1 || reason.length > 500) {
    return NextResponse.json(
      { error: "Add a reason (up to 500 characters) — it goes in the audit log." },
      { status: 400 },
    );
  }

  const result =
    action === "deactivate"
      ? await deactivateUser(user.id, userId, reason)
      : await reinstateUser(user.id, userId, reason);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }
    if (result.reason === "no_change") {
      return NextResponse.json(
        { error: "Already in that state — refresh the page." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Not available right now. Please try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ done: true });
}
