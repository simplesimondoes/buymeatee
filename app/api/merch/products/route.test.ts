import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/merch/products/route";

vi.mock("@/lib/merch/config", () => ({
  isMerchCreatorStudioOpen: vi.fn(() => true),
}));
vi.mock("@/lib/merch/products", () => ({
  createProduct: vi.fn(),
  getOwnProducts: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(),
}));

const { isMerchCreatorStudioOpen } = await import("@/lib/merch/config");
const { createProduct, getOwnProducts } = await import("@/lib/merch/products");
const { getAuthenticatedUser } = await import("@/lib/supabase/server");

let ip = 0;
function req(body: unknown): Request {
  ip += 1;
  return new Request("https://buymeatee.com/api/merch/products", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ip}` },
    body: JSON.stringify(body),
  });
}

const validBody = {
  curatedProductId: "c1",
  title: "My Tee",
  slug: "my-tee",
  currency: "gbp",
  retailPriceMinor: 3000,
  placement: "front",
  selectedVariantIds: [4011],
  selectedColours: ["black"],
  selectedSizes: ["M"],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isMerchCreatorStudioOpen).mockReturnValue(true);
  vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);
});

describe("POST /api/merch/products", () => {
  it("requires sign-in", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(401);
    expect(vi.mocked(createProduct)).not.toHaveBeenCalled();
  });

  it("returns 503 when the merch studio is closed", async () => {
    vi.mocked(isMerchCreatorStudioOpen).mockReturnValue(false);
    const res = await POST(req(validBody));
    expect(res.status).toBe(503);
  });

  it("rejects malformed input with 400 before hitting the service", async () => {
    const res = await POST(req({ title: 123 }));
    expect(res.status).toBe(400);
    expect(vi.mocked(createProduct)).not.toHaveBeenCalled();
  });

  it("creates a product and returns 201", async () => {
    vi.mocked(createProduct).mockResolvedValue({
      ok: true,
      product: { id: "p1" } as never,
    });
    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    expect(vi.mocked(createProduct)).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ curatedProductId: "c1", retailPriceMinor: 3000 }),
    );
  });

  it("surfaces field-level merch validation codes on 400", async () => {
    vi.mocked(createProduct).mockResolvedValue({
      ok: false,
      reason: "invalid_configuration",
      errors: ["variant-not-allowed", "below-minimum-price"],
    });
    const res = await POST(req(validBody));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { merchErrors: string[] };
    expect(json.merchErrors).toEqual(["variant-not-allowed", "below-minimum-price"]);
  });

  it("maps a missing curated product to 404", async () => {
    vi.mocked(createProduct).mockResolvedValue({ ok: false, reason: "curated_unavailable" });
    const res = await POST(req(validBody));
    expect(res.status).toBe(404);
  });
});

describe("GET /api/merch/products", () => {
  it("returns the caller's products", async () => {
    vi.mocked(getOwnProducts).mockResolvedValue([{ id: "p1" } as never]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { products: unknown[] };
    expect(json.products).toHaveLength(1);
  });
});
