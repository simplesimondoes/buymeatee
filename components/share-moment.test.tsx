import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { GiftConfirmation } from "@/components/payments/gift-confirmation";
import { ShareMoment } from "@/components/share-moment";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ShareMoment", () => {
  it("shows the translated suggested copy in an editable textarea", () => {
    renderWithIntl(
      <ShareMoment
        heading="Share it"
        message={{ key: "updatePublished", params: { title: "Broke 80" } }}
        url="https://buymeatee.com/t/james"
      />,
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toContain("Broke 80");
    expect(textarea.value).toContain("BuyMeATee");

    fireEvent.change(textarea, { target: { value: "My own words" } });
    expect(textarea.value).toBe("My own words");
  });

  it("copies the caption plus URL to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    renderWithIntl(
      <ShareMoment
        heading="Share it"
        message="Great news from the course"
        url="https://buymeatee.com/t/james"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy caption" }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith(
      "Great news from the course\n\nhttps://buymeatee.com/t/james",
    );
    expect(screen.getByText("Caption copied")).toBeInTheDocument();
  });

  it("replaces the copy with an AI suggestion when personalise succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "A personalised post" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(
      <ShareMoment
        heading="Share it"
        message="Template copy"
        url="https://buymeatee.com/t/james"
        personalise={{
          endpoint: "/api/share/personalise",
          payload: { kind: "update", title: "T" },
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Personalise with AI" }));
    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "A personalised post",
      ),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/share/personalise",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reports honestly when AI personalisation is not configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 503 })),
    );

    renderWithIntl(
      <ShareMoment
        heading="Share it"
        message="Template copy"
        url="https://buymeatee.com/t/james"
        personalise={{ endpoint: "/api/share/personalise", payload: {} }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Personalise with AI" }));
    await waitFor(() =>
      expect(
        screen.getByText("AI suggestions aren't available yet."),
      ).toBeInTheDocument(),
    );
    // The template copy is untouched and the button is withdrawn.
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      "Template copy",
    );
    expect(
      screen.queryByRole("button", { name: "Personalise with AI" }),
    ).not.toBeInTheDocument();
  });

  it("can be dismissed", () => {
    const onDismiss = vi.fn();
    renderWithIntl(
      <ShareMoment
        heading="Share it"
        message="Copy"
        url="https://buymeatee.com/t/james"
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("GiftConfirmation supporter share prompt", () => {
  const paid = {
    phase: "paid" as const,
    recipientName: "James",
    recipientUsername: "james",
    giftAmount: 500,
    currency: "gbp" as const,
    message: null,
    senderName: "Sam",
    isAnonymous: false,
    target: { kind: "goal" as const, title: "New putter" },
  };

  it("offers an opt-in share prompt only once payment is verified", () => {
    renderWithIntl(<GiftConfirmation publicId="p1" initial={paid} />);
    expect(
      screen.getByText("Would you like to let others know?"),
    ).toBeInTheDocument();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    // Supporter voice, honest content: names the goal, never the amount.
    expect(textarea.value).toContain("James");
    expect(textarea.value).toContain("New putter");
    expect(textarea.value).not.toContain("£");
  });

  it("shows no share prompt while the payment is unconfirmed", () => {
    renderWithIntl(
      <GiftConfirmation
        publicId="p1"
        initial={{ ...paid, phase: "confirming" }}
      />,
    );
    expect(
      screen.queryByText("Would you like to let others know?"),
    ).not.toBeInTheDocument();
  });
});
