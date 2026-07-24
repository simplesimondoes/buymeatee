import { describe, expect, it } from "vitest";

import {
  renderEarlyAccessWelcomeEmail,
  renderGiftReceiptEmail,
  renderGiftReceivedEmail,
  renderGoalReachedEmail,
} from "@/lib/email/templates";

describe("renderGiftReceivedEmail", () => {
  it("formats the amount and names the sender", () => {
    const email = renderGiftReceivedEmail({
      senderDisplayName: "Alex",
      amount: 1250,
      currency: "gbp",
    });
    expect(email.subject).toContain("£12.50");
    expect(email.subject).toContain("Alex");
    expect(email.html).toContain("£12.50");
    expect(email.text).toContain("Alex just bought you a tee — £12.50.");
  });

  it("includes an optional message as an escaped blockquote", () => {
    const email = renderGiftReceivedEmail({
      senderDisplayName: "Sam",
      amount: 500,
      currency: "eur",
      message: "Keep it up!",
    });
    expect(email.html).toContain("Keep it up!");
    expect(email.text).toContain('"Keep it up!"');
  });

  it("escapes HTML in the sender name and message (injection safe)", () => {
    const email = renderGiftReceivedEmail({
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

  it("uses a fallback name when the sender is anonymous/empty", () => {
    const email = renderGiftReceivedEmail({
      senderDisplayName: "",
      amount: 100,
      currency: "gbp",
    });
    expect(email.subject).toContain("a supporter");
  });
});

describe("renderGiftReceiptEmail", () => {
  it("thanks the supporter and names the creator", () => {
    const email = renderGiftReceiptEmail({
      creatorName: "Jordan",
      amount: 2000,
      currency: "gbp",
    });
    expect(email.subject).toContain("£20.00");
    expect(email.html).toContain("Jordan");
    expect(email.text).toContain("Thanks for buying Jordan a tee.");
  });

  it("escapes the creator name", () => {
    const email = renderGiftReceiptEmail({
      creatorName: "<b>x</b>",
      amount: 100,
      currency: "eur",
    });
    expect(email.html).not.toContain("<b>x</b>");
    expect(email.html).toContain("&lt;b&gt;");
  });
});

describe("renderEarlyAccessWelcomeEmail", () => {
  it("greets by name and reflects the creator role", () => {
    const email = renderEarlyAccessWelcomeEmail({
      name: "Robin",
      role: "creator",
    });
    expect(email.html).toContain("Hi Robin");
    expect(email.html).toContain("As a creator");
    expect(email.text).toContain("you're on the list");
  });

  it("reflects the supporter role", () => {
    const email = renderEarlyAccessWelcomeEmail({
      name: "Robin",
      role: "supporter",
    });
    expect(email.html).toContain("As a supporter");
  });
});

describe("renderGoalReachedEmail", () => {
  it("reports raised and target amounts", () => {
    const email = renderGoalReachedEmail({
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

  it("escapes the goal title", () => {
    const email = renderGoalReachedEmail({
      goalTitle: "<script>x</script>",
      raisedAmount: 100,
      targetAmount: 100,
      currency: "eur",
    });
    expect(email.html).not.toContain("<script>x");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
