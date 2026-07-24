import { afterEach, describe, expect, it, vi } from "vitest";

import { getEmailConfig, isEmailConfigured } from "@/lib/email/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEmailConfig", () => {
  it("returns null when the API key is missing", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "BuyMeATee <hi@buymeatee.com>");
    expect(getEmailConfig()).toBeNull();
    expect(isEmailConfigured()).toBe(false);
  });

  it("returns null when the sender is missing", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "");
    expect(getEmailConfig()).toBeNull();
  });

  it("reads key, sender and optional reply-to when configured", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "BuyMeATee <hi@buymeatee.com>");
    vi.stubEnv("EMAIL_REPLY_TO", "support@buymeatee.com");
    expect(getEmailConfig()).toEqual({
      apiKey: "re_test",
      from: "BuyMeATee <hi@buymeatee.com>",
      replyTo: "support@buymeatee.com",
    });
    expect(isEmailConfigured()).toBe(true);
  });

  it("omits reply-to when unset", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "BuyMeATee <hi@buymeatee.com>");
    vi.stubEnv("EMAIL_REPLY_TO", "");
    expect(getEmailConfig()).toEqual({
      apiKey: "re_test",
      from: "BuyMeATee <hi@buymeatee.com>",
    });
  });
});
