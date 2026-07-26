import { describe, expect, it, vi } from "vitest";

import { PrintfulClient } from "@/lib/printful/client";
import { PrintfulError } from "@/lib/printful/errors";
import type { PrintfulConfig } from "@/lib/printful/config";
import {
  findOrderByExternalId,
  submitOrder,
} from "@/lib/printful/orders";

const config: PrintfulConfig = {
  apiToken: "test-token-should-never-be-logged",
  storeId: "42",
  baseUrl: "https://api.printful.test",
  orderMode: "draft",
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function makeClient(fetchImpl: typeof fetch, logs: string[] = []) {
  return new PrintfulClient({
    config,
    fetchImpl,
    sleep: async () => {}, // no real backoff in tests
    correlationId: () => "corr-1",
    log: (m) => logs.push(m),
  });
}

describe("PrintfulClient.request", () => {
  it("unwraps a successful envelope and passes result to the parser", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ code: 200, result: { id: 7 } }),
    ) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    const result = await client.request({
      method: "GET",
      path: "/orders/7",
      parse: (r) => (r as { id: number }).id,
    });
    expect(result).toBe(7);
  });

  it("sends the Bearer token and store header, but never logs the token", async () => {
    const logs: string[] = [];
    let seenAuth: string | null = null;
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      seenAuth = new Headers(init.headers).get("Authorization");
      return jsonResponse({ code: 200, result: {} });
    }) as unknown as typeof fetch;
    const client = makeClient(fetchImpl, logs);
    await client.request({ method: "GET", path: "/x", parse: () => null });
    expect(seenAuth).toBe(`Bearer ${config.apiToken}`);
    expect(logs.join("\n")).not.toContain(config.apiToken);
  });

  it("retries retryable 5xx then throws a structured http error", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ code: 500, error: { message: "boom" } }, { status: 500 }),
    ) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    await expect(
      client.request({ method: "GET", path: "/x", parse: () => null, maxAttempts: 3 }),
    ).rejects.toMatchObject({ kind: "http", retryable: true });
    expect((fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(3);
  });

  it("recovers when a 429 is followed by a success", async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ code: 429, error: { message: "slow down" } }, {
          status: 429,
          headers: { "Retry-After": "0" },
        });
      }
      return jsonResponse({ code: 200, result: { ok: true } });
    }) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    const result = await client.request({
      method: "GET",
      path: "/x",
      parse: (r) => r as { ok: boolean },
    });
    expect(result).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("does not retry a POST by default", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ code: 500, error: { message: "boom" } }, { status: 500 }),
    ) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    await expect(
      client.request({ method: "POST", path: "/orders", body: {}, parse: () => null }),
    ).rejects.toBeInstanceOf(PrintfulError);
    expect((fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(1);
  });

  it("maps an aborted request to a timeout error", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      // Simulate the abort signal firing.
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    }) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    await expect(
      client.request({
        method: "GET",
        path: "/x",
        parse: () => null,
        timeoutMs: 5,
        maxAttempts: 1,
      }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  it("raises a validation error on a non-JSON body", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("<html>oops</html>", { status: 200 }),
    ) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    await expect(
      client.request({ method: "GET", path: "/x", parse: () => null }),
    ).rejects.toMatchObject({ kind: "validation" });
  });
});

describe("idempotent order submission", () => {
  it("findOrderByExternalId returns null on 404", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ code: 404, error: { message: "not found" } }, { status: 404 }),
    ) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    expect(await findOrderByExternalId(client, "BMT-ORDER-1")).toBeNull();
  });

  it("submitOrder returns the existing order without creating a duplicate", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      calls.push(`${init.method} ${url}`);
      // The pre-check GET finds an existing order.
      return jsonResponse({
        code: 200,
        result: { id: 999, external_id: "BMT-ORDER-1", status: "draft", shipments: [] },
      });
    }) as unknown as typeof fetch;
    const client = makeClient(fetchImpl);
    const { order, alreadyExisted } = await submitOrder(client, {
      externalId: "BMT-ORDER-1",
      recipient: {
        name: "A",
        address1: "1 St",
        city: "Town",
        countryCode: "GB",
        zip: "AB1 2CD",
      },
      items: [{ variantId: 1, quantity: 1, files: [{ url: "https://x/art.png" }] }],
      mode: "draft",
    });
    expect(alreadyExisted).toBe(true);
    expect(order.id).toBe(999);
    // Only the GET pre-check ran; no POST /orders.
    expect(calls.some((c) => c.startsWith("POST"))).toBe(false);
  });
});
