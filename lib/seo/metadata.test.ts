import { describe, expect, it } from "vitest";

import { canonicalUrl, pageMetadata, rootMetadata } from "@/lib/seo/metadata";

describe("canonicalUrl", () => {
  it("builds absolute URLs from route paths", () => {
    expect(canonicalUrl("/for-creators")).toBe(
      "https://buymeatee.com/for-creators",
    );
  });

  it("keeps the homepage as the bare origin with trailing slash", () => {
    expect(canonicalUrl("/")).toBe("https://buymeatee.com/");
  });
});

describe("pageMetadata", () => {
  const metadata = pageMetadata({
    title: "For Golf Creators",
    description: "A description.",
    path: "/for-creators",
  });

  it("sets title, description and canonical", () => {
    expect(metadata.title).toBe("For Golf Creators");
    expect(metadata.description).toBe("A description.");
    expect(metadata.alternates?.canonical).toBe(
      "https://buymeatee.com/for-creators",
    );
  });

  it("mirrors values into Open Graph and Twitter cards", () => {
    expect(metadata.openGraph).toMatchObject({
      title: "For Golf Creators",
      description: "A description.",
      url: "https://buymeatee.com/for-creators",
      siteName: "BuyMeATee",
      locale: "en_GB",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "For Golf Creators",
    });
  });

  it("supports the article OG type for blog posts", () => {
    const article = pageMetadata({
      title: "T",
      description: "D",
      path: "/blog/x",
      ogType: "article",
    });
    expect(article.openGraph).toMatchObject({ type: "article" });
  });
});

describe("rootMetadata", () => {
  it("uses the brand default title and template", () => {
    const metadata = rootMetadata();
    expect(metadata.title).toEqual({
      default: "BuyMeATee — Support the Golf Journey",
      template: "%s | BuyMeATee",
    });
    const base = metadata.metadataBase;
    expect(base).toBeInstanceOf(URL);
    expect((base as URL).origin).toBe("https://buymeatee.com");
  });
});
