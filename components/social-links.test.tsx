import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { SocialLinks } from "@/components/social-links";
import { siteConfig } from "@/lib/site";

describe("SocialLinks", () => {
  it("renders one accessible link per configured profile", () => {
    renderWithIntl(<SocialLinks />);

    const list = screen.getByRole("list", { name: "Follow BuyMeATee" });
    expect(list).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Follow BuyMeATee on Bluesky" }),
    ).toHaveAttribute("href", "https://bsky.app/profile/buymeatee.bsky.social");
    expect(
      screen.getByRole("link", { name: "Follow BuyMeATee on X" }),
    ).toHaveAttribute("href", "https://x.com/BuyMeaTee");
    expect(
      screen.getByRole("link", { name: "Follow BuyMeATee on Instagram" }),
    ).toHaveAttribute("href", "https://www.instagram.com/BuyMeaTee");

    expect(screen.getAllByRole("link")).toHaveLength(
      siteConfig.socialLinks.length,
    );
  });

  it("opens profiles in a new tab without a referrer/opener", () => {
    renderWithIntl(<SocialLinks />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
