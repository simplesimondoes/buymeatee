import { NextResponse } from "next/server";

import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { apiError } from "@/lib/api/errors";
import {
  curateProductFromPrintful,
  getPrintfulProductOptions,
} from "@/lib/merch/admin-catalogue";
import { isSupportedCurrency } from "@/lib/payments/currency";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Owner-only merch catalogue curation (ADR-024, spec §6). GET loads a live
 * Printful product's colour/size options for the form; POST curates a chosen
 * subset into an enabled catalogue product with real Printful variant ids.
 * Gated by the same owner check as analytics; non-owners get a plain 404.
 */

async function requireOwner() {
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return { error: apiError("api.signInRequired", { status: 401 }) };
  }
  if (!canViewAnalytics(user.email)) {
    return { error: apiError("api.notFound", { status: 404 }) };
  }
  return { user };
}

export async function GET(request: Request) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const productId = Number.parseInt(
    new URL(request.url).searchParams.get("productId") ?? "",
    10,
  );
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const result = await getPrintfulProductOptions(productId);
  if (!result.ok) {
    return NextResponse.json({ error: { code: "api.unavailable" }, detail: result.error }, { status: 502 });
  }
  return NextResponse.json({ options: result.options });
}

export async function POST(request: Request) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;
  if (isRateLimited(`merch-curate:${clientKeyFromHeaders(request.headers)}`, 30, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const p = body as Record<string, unknown>;
  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  if (
    typeof p.printfulProductId !== "number" ||
    typeof p.slug !== "string" ||
    typeof p.currency !== "string" ||
    !isSupportedCurrency(p.currency) ||
    !isStringArray(p.colours) ||
    !isStringArray(p.sizes) ||
    !isStringArray(p.placements)
  ) {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const result = await curateProductFromPrintful({
    printfulProductId: p.printfulProductId,
    slug: p.slug,
    displayName: typeof p.displayName === "string" ? p.displayName : undefined,
    category: typeof p.category === "string" ? p.category : undefined,
    currency: p.currency,
    colours: p.colours,
    sizes: p.sizes,
    placements: p.placements,
    defaultPlacement:
      typeof p.defaultPlacement === "string" ? p.defaultPlacement : undefined,
    minimumRetailPriceMinor:
      typeof p.minimumRetailPriceMinor === "number" ? p.minimumRetailPriceMinor : undefined,
    minimumCreatorProfitMinor:
      typeof p.minimumCreatorProfitMinor === "number" ? p.minimumCreatorProfitMinor : undefined,
    enabled: p.enabled === true,
  });
  if (!result.ok) {
    return NextResponse.json({ error: { code: "api.savingUnavailable" }, detail: result.error }, { status: 400 });
  }
  return NextResponse.json({ id: result.id, variantCount: result.variantCount }, { status: 201 });
}
