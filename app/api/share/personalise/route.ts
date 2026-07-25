import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isAppLocale } from "@/i18n/locales";
import {
  isSharePersonalisationConfigured,
  personaliseShareCopy,
  type PersonaliseRequest,
} from "@/lib/share/personalise";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const KINDS = new Set(["update", "page", "goal", "wishlist"]);

/**
 * Suggests personalised share copy for the signed-in creator (ADR-021).
 * Auth-gated and rate-limited because each call spends money on an AI
 * request; supporters and anonymous visitors get the template copy only.
 * 503 = not configured — the client keeps the template and says so honestly.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!isSharePersonalisationConfigured()) {
    return apiError("api.unavailable", { status: 503 });
  }
  if (isRateLimited(`share-ai:${user.id}`, 10, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = (await request.json().catch(() => null)) as {
    kind?: unknown;
    title?: unknown;
    body?: unknown;
    displayName?: unknown;
    locale?: unknown;
  } | null;
  if (!payload || typeof payload.kind !== "string" || !KINDS.has(payload.kind)) {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const asText = (value: unknown, max: number): string | undefined =>
    typeof value === "string" && value.trim()
      ? value.trim().slice(0, max)
      : undefined;

  const text = await personaliseShareCopy({
    kind: payload.kind as PersonaliseRequest["kind"],
    locale: isAppLocale(payload.locale) ? payload.locale : "en",
    context: {
      title: asText(payload.title, 200),
      body: asText(payload.body, 4000),
      displayName: asText(payload.displayName, 100),
    },
  });
  if (!text) {
    return apiError("api.unavailable", { status: 502 });
  }
  return NextResponse.json({ text });
}
