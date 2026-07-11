import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/early-access/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/early-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  role: "supporter",
  name: "Sam Example",
  email: "sam@example.com",
  country: "Ireland",
  consent: true,
};

describe("POST /api/early-access", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 400 with field errors for an invalid submission", async () => {
    const response = await POST(makeRequest({ role: "supporter" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.status).toBe("invalid");
    expect(body.errors.email).toBeTruthy();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const response = await POST(
      new Request("http://localhost/api/early-access", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("honestly reports 503 when no endpoint is configured", async () => {
    vi.stubEnv("EARLY_ACCESS_API_URL", "");
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("not-configured");
  });

  it("forwards valid submissions to the configured endpoint", async () => {
    vi.stubEnv("EARLY_ACCESS_API_URL", "https://provider.example/submit");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("submitted");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://provider.example/submit");
    const forwarded = JSON.parse(String(init?.body));
    expect(forwarded).toMatchObject({
      role: "supporter",
      email: "sam@example.com",
    });
  });

  it("returns 502 when the configured endpoint rejects", async () => {
    vi.stubEnv("EARLY_ACCESS_API_URL", "https://provider.example/submit");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(502);
  });

  it("silently drops honeypot submissions with a fake success", async () => {
    vi.stubEnv("EARLY_ACCESS_API_URL", "https://provider.example/submit");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await POST(
      makeRequest({ ...validBody, website: "spam-bot-filled-this" }),
    );
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
