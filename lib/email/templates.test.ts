import { describe, expect, it } from "vitest";

import {
  renderGiftReceiptEmail,
  renderGiftReceivedEmail,
  renderGoalReachedEmail,
} from "@/lib/email/templates";

describe("renderGiftReceivedEmail", () => {
  it("formats the amount and names the sender", async () => {
    const email = await renderGiftReceivedEmail({
      senderDisplayName: "Alex",
      amount: 1250,
      currency: "gbp",
    });
    expect(email.subject).toContain("£12.50");
    expect(email.subject).toContain("Alex");
    expect(email.html).toContain("£12.50");
    expect(email.text).toContain("Alex just bought you a tee — £12.50.");
  });

  it("includes an optional message as an escaped blockquote", async () => {
    const email = await renderGiftReceivedEmail({
      senderDisplayName: "Sam",
      amount: 500,
      currency: "eur",
      message: "Keep it up!",
    });
    expect(email.html).toContain("Keep it up!");
    expect(email.text).toContain('"Keep it up!"');
  });

  it("escapes HTML in the sender name and message (injection safe)", async () => {
    const email = await renderGiftReceivedEmail({
      senderDisplayName: "<script>evil()</script>",
      amount: 100,
      currency: "gbp",
      message: "<img src=x onerror=alert(1)>",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;img src=x");
  });

  it("uses a fallback name when the sender is anonymous/empty", async () => {
    const email = await renderGiftReceivedEmail({
      senderDisplayName: "",
      amount: 100,
      currency: "gbp",
    });
    expect(email.subject).toContain("a supporter");
  });

  it("renders in the recipient's locale with a localized dashboard link", async () => {
    const email = await renderGiftReceivedEmail({
      senderDisplayName: "Alex",
      amount: 1250,
      currency: "eur",
      locale: "de",
    });
    // German catalog may not exist yet — the guarantee is: never raw keys,
    // English fallback at worst, and the CTA links to the /de dashboard.
    expect(email.html).toContain("/de/dashboard");
    expect(email.html).toContain('lang="de"');
    expect(email.subject).not.toContain("giftReceived.");
  });
});

describe("renderGiftReceiptEmail", () => {
  it("thanks the supporter and names the creator", async () => {
    const email = await renderGiftReceiptEmail({
      creatorName: "Jordan",
      amount: 2000,
      currency: "gbp",
    });
    expect(email.subject).toContain("£20.00");
    expect(email.html).toContain("Jordan");
    expect(email.text).toContain("Thanks for buying Jordan a tee.");
  });

  it("escapes the creator name", async () => {
    const email = await renderGiftReceiptEmail({
      creatorName: "<b>x</b>",
      amount: 100,
      currency: "eur",
    });
    expect(email.html).not.toContain("<b>x</b>");
    expect(email.html).toContain("&lt;b&gt;");
  });

  it("links Discover in the supporter's checkout language", async () => {
    const email = await renderGiftReceiptEmail({
      creatorName: "Jordan",
      amount: 2000,
      currency: "eur",
      locale: "fr",
    });
    expect(email.html).toContain("/fr/discover");
    expect(email.html).toContain('lang="fr"');
  });
});

describe("renderGoalReachedEmail", () => {
  it("reports raised and target amounts", async () => {
    const email = await renderGoalReachedEmail({
      goalTitle: "New irons",
      raisedAmount: 30000,
      targetAmount: 25000,
      currency: "gbp",
    });
    expect(email.subject).toContain("New irons");
    expect(email.html).toContain("£300.00");
    expect(email.html).toContain("£250.00");
    expect(email.text).toContain("Raised so far: £300.00 of £250.00.");
  });

  it("escapes the goal title", async () => {
    const email = await renderGoalReachedEmail({
      goalTitle: "<script>x</script>",
      raisedAmount: 100,
      targetAmount: 100,
      currency: "eur",
    });
    expect(email.html).not.toContain("<script>x");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("never translates the creator's goal title", async () => {
    const email = await renderGoalReachedEmail({
      goalTitle: "Neue Eisen für die Saison",
      raisedAmount: 100,
      targetAmount: 100,
      currency: "eur",
      locale: "ja",
    });
    expect(email.subject).toContain("Neue Eisen für die Saison");
    expect(email.html).toContain('lang="ja"');
  });
});
