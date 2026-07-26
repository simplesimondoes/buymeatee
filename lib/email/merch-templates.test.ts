import { describe, expect, it } from "vitest";

import {
  renderMerchOrderConfirmationEmail,
  renderMerchOrderShippedEmail,
  renderMerchSaleRecordedEmail,
} from "@/lib/email/merch-templates";

describe("renderMerchOrderConfirmationEmail", () => {
  it("includes the order reference, formatted total and notices; no Printful cost", async () => {
    const email = await renderMerchOrderConfirmationEmail({
      publicReference: "BMT-MERCH-ABC123",
      total: 3499,
      currency: "gbp",
      locale: "en",
    });
    expect(email.subject).toContain("BMT-MERCH-ABC123");
    expect(email.html).toContain("BMT-MERCH-ABC123");
    expect(email.html).toContain("£34.99");
    expect(email.html.toLowerCase()).toContain("production");
    expect(email.text).toContain("BMT-MERCH-ABC123");
  });
});

describe("renderMerchOrderShippedEmail", () => {
  it("shows the reference, carrier and a tracking CTA when a URL is given", async () => {
    const email = await renderMerchOrderShippedEmail({
      publicReference: "BMT-MERCH-XYZ",
      carrier: "Royal Mail",
      trackingUrl: "https://track/RM1",
      locale: "en",
    });
    expect(email.html).toContain("BMT-MERCH-XYZ");
    expect(email.html).toContain("Royal Mail");
    expect(email.html).toContain("https://track/RM1");
  });

  it("omits the tracking CTA when no URL is available", async () => {
    const email = await renderMerchOrderShippedEmail({
      publicReference: "BMT-MERCH-XYZ",
      locale: "en",
    });
    expect(email.html).not.toContain("track/");
  });
});

describe("renderMerchSaleRecordedEmail", () => {
  it("names the product and the creator's profit", async () => {
    const email = await renderMerchSaleRecordedEmail({
      productTitle: "Birdie Tee",
      profit: 1080,
      currency: "gbp",
      locale: "en",
    });
    expect(email.html).toContain("Birdie Tee");
    expect(email.html).toContain("£10.80");
    expect(email.subject.toLowerCase()).toContain("sale");
  });

  it("escapes HTML in the product title", async () => {
    const email = await renderMerchSaleRecordedEmail({
      productTitle: "<script>x</script>",
      profit: 500,
      currency: "gbp",
      locale: "en",
    });
    expect(email.html).not.toContain("<script>x</script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("localises the subject (German)", async () => {
    const email = await renderMerchSaleRecordedEmail({
      productTitle: "Tee",
      profit: 1000,
      currency: "eur",
      locale: "de",
    });
    expect(email.subject).toContain("Merch");
    expect(email.html).toContain("10,00");
  });
});
