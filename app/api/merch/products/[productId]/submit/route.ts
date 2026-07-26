import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isMerchCreatorStudioOpen } from "@/lib/merch/config";
import { submitForReview } from "@/lib/merch/products";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Submit a creator's product for moderation (ADR-024, spec §10/§24). The
 * service uses the admin client to set the moderation columns (no client grant)
 * behind an ownership check, and requires mockups to be ready.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const clientKey = clientKeyFromHeaders(request.headers);
  if (isRateLimited(`merch-submit:${clientKey}`, 20, 60_000)) {
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
  const result = await submitForReview(user.id, productId);
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
