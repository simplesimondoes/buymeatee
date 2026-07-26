import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isMerchCreatorStudioOpen } from "@/lib/merch/config";
import { createProduct, getOwnProducts } from "@/lib/merch/products";
import { parseProductInput } from "@/lib/merch/product-schema";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Creator merchandise products (ADR-024). Create a draft product (POST) or list
 * the caller's own products (GET). Gated by the merch beta studio flag; the
 * service layer re-validates the configuration against the curated allow-lists.
 * Field-level failures come back as stable merch codes for the shop namespace.
 */

export async function GET() {
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!isMerchCreatorStudioOpen()) {
    return apiError("api.unavailable", { status: 503 });
  }
  try {
    const products = await getOwnProducts(user.id);
    return NextResponse.json({ products });
  } catch {
    return apiError("api.unavailable", { status: 503 });
  }
}

export async function POST(request: Request) {
  const clientKey = clientKeyFromHeaders(request.headers);
  if (isRateLimited(`merch-product:${clientKey}`, 20, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }

  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!isMerchCreatorStudioOpen()) {
    return apiError("api.unavailable", { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const parsed = parseProductInput(payload);
  if (!parsed.ok) {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const result = await createProduct(user.id, parsed.data);
  if (result.ok) {
    return NextResponse.json({ product: result.product }, { status: 201 });
  }

  switch (result.reason) {
    case "curated_unavailable":
      return apiError("api.notFound", { status: 404 });
    case "invalid_configuration":
      // Stable merch codes for the shop namespace to render field guidance.
      return NextResponse.json(
        { error: { code: "api.checkFields" }, merchErrors: result.errors ?? [] },
        { status: 400 },
      );
    default:
      return apiError("api.unavailable", { status: 503 });
  }
}
