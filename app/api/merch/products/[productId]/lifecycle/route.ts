import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isMerchCreatorStudioOpen } from "@/lib/merch/config";
import {
  markPreviewReady,
  publishProduct,
  setProductPaused,
  type ProductMutationResult,
} from "@/lib/merch/products";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Creator product lifecycle actions (ADR-024): preview (mark preview ready),
 * publish (an approved product) and pause/resume. Auth + beta gated; the
 * service layer enforces ownership and valid state transitions.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  if (isRateLimited(`merch-lifecycle:${clientKeyFromHeaders(request.headers)}`, 30, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!isMerchCreatorStudioOpen()) {
    return apiError("api.unavailable", { status: 503 });
  }

  const { productId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const action = (body as { action?: unknown }).action;

  let result: ProductMutationResult;
  switch (action) {
    case "preview":
      result = await markPreviewReady(user.id, productId);
      break;
    case "publish":
      result = await publishProduct(user.id, productId);
      break;
    case "pause":
      result = await setProductPaused(user.id, productId, true);
      break;
    case "resume":
      result = await setProductPaused(user.id, productId, false);
      break;
    default:
      return apiError("api.invalidRequest", { status: 400 });
  }

  if (result.ok) {
    return NextResponse.json({ product: result.product });
  }
  switch (result.reason) {
    case "not_found":
      return apiError("api.notFound", { status: 404 });
    case "invalid_state":
      return apiError("api.alreadyInState", { status: 409 });
    default:
      return apiError("api.unavailable", { status: 503 });
  }
}
