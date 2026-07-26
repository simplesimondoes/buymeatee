import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { CreatorStats } from "@/components/support/creator-stats";
import { RecentSupport } from "@/components/support/recent-support";
import { GiftConfirmation } from "@/components/payments/gift-confirmation";
import { ShareControls } from "@/components/share-controls";
import { PublicJourney } from "@/components/journey/public-journey";
import { StickySupportBar } from "@/components/profile/sticky-support-bar";
import { CopyLinkButton } from "@/components/profile/copy-link-button";

describe("smoke: i18n renders", () => {
  it("CreatorStats pluralises", () => {
    renderWithIntl(
      <CreatorStats supporters={1} goalsReached={2} updates={3} joined="July 2026" />,
    );
    expect(screen.getAllByText("supporter").length).toBeGreaterThan(0);
    expect(screen.getAllByText("goals reached").length).toBeGreaterThan(0);
    expect(screen.getByText("Joined July 2026")).toBeInTheDocument();
  });

  it("RecentSupport renders rich sentence and targets", () => {
    renderWithIntl(
      <RecentSupport
        items={[
          {
            displayName: "Sam",
            paidAt: "2026-07-20T00:00:00Z",
            amount: 500,
            currency: "gbp",
            message: "Go get it",
            target: { kind: "goal", title: "New putter" },
          },
          {
            displayName: "Anonymous",
            paidAt: "2026-07-21T00:00:00Z",
            amount: 4500,
            currency: "gbp",
            message: null,
            target: { kind: "wishlist", title: "Range balls" },
          },
        ]}
      />,
    );
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText("£5.00")).toBeInTheDocument();
    expect(screen.getByText(/toward New putter/)).toBeInTheDocument();
    expect(screen.getByText(/funded Range balls/)).toBeInTheDocument();
  });

  it("RecentSupport empty state", () => {
    renderWithIntl(<RecentSupport items={[]} />);
    expect(
      screen.getByText("Be the first golfer to back this project."),
    ).toBeInTheDocument();
  });

  it("GiftConfirmation paid with target", () => {
    renderWithIntl(
      <GiftConfirmation
        publicId="p1"
        initial={{
          phase: "paid",
          recipientName: "James",
          recipientUsername: "james",
          giftAmount: 500,
          currency: "gbp",
          message: "Nice one",
          senderName: "Sam",
          isAnonymous: true,
          target: { kind: "goal", title: "New putter" },
        }}
      />,
    );
    expect(
      screen.getByText("Your Tee is on its way to James."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/£5\.00 from Anonymous was paid successfully toward/),
    ).toBeInTheDocument();
    expect(screen.getByText("New putter")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to James's page" }),
    ).toBeInTheDocument();
  });

  it("GiftConfirmation confirming / failed states", () => {
    renderWithIntl(
      <GiftConfirmation
        publicId="p1"
        initial={{
          phase: "failed",
          recipientName: "James",
          recipientUsername: "james",
          giftAmount: 500,
          currency: "gbp",
          message: null,
          senderName: "Sam",
          isAnonymous: false,
          target: null,
        }}
      />,
    );
    expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toBeInTheDocument();
  });

  it("ShareControls translates a ShareMessage", () => {
    renderWithIntl(
      <ShareControls
        url="https://buymeatee.com/t/james"
        text={{ key: "goalMilestone", params: { title: "New putter", percent: 50 } }}
      />,
    );
    const button = screen.getByRole("button", { name: "Share" });
    button.click();
  });

  it("PublicJourney renders localized dates and headings", () => {
    renderWithIntl(
      <PublicJourney
        posts={[
          {
            id: "11111111-1111-1111-1111-111111111111",
            creator_id: "c1",
            title: "First round",
            body: "Played well.",
            image_url: null,
            kind: "update",
            goal_id: null,
            video_url: null,
            milestone_label: null,
            milestone_percent: null,
            like_count: 0,
            comment_count: 0,
            status: "published",
            published_at: "2026-07-12T00:00:00Z",
            created_at: "2026-07-12T00:00:00Z",
            updated_at: "2026-07-12T00:00:00Z",
            media: [],
            comments: [],
            viewerHasLiked: false,
          },
        ]}
        creatorName="James"
        isOwner={false}
        isSignedIn={false}
        currentUserId={null}
        signInHref="/en/sign-in"
        pageUrl="https://buymeatee.com/t/james"
      />,
    );
    expect(screen.getByText("James's journey")).toBeInTheDocument();
    expect(screen.getByText("12 July 2026")).toBeInTheDocument();
  });

  it("StickySupportBar and CopyLinkButton render", () => {
    renderWithIntl(
      <>
        <StickySupportBar name="James" topGoal={null} />
        <CopyLinkButton username="james" />
      </>,
    );
    // The sticky bar starts hidden until its sentinel scrolls away.
    expect(screen.getByText("Buy James a tee")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy your link" })).toBeInTheDocument();
  });
});
