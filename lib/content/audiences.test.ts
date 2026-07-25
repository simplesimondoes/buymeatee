import { describe, expect, it } from "vitest";

import { enMessages } from "@/i18n/en";
import {
  audiences,
  audienceSlugs,
  getAudience,
  getAudienceExampleGoals,
  type Audience,
} from "@/lib/content/audiences";
import { exampleGoalItems } from "@/lib/content/example-goals";

type MessageNode = Record<string, unknown>;

function resolve(key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as MessageNode)[part]
          : undefined,
      enMessages.audiences,
    );
}

function expectString(key: string) {
  expect(typeof resolve(key), `audiences.${key} must be a string`).toBe(
    "string",
  );
}

describe("audiences registry", () => {
  it("has nine audiences with unique, kebab-case, language-neutral slugs", () => {
    expect(audiences).toHaveLength(9);
    const slugs = audiences.map((audience) => audience.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
    expect(audienceSlugs).toEqual(slugs);
  });

  it("resolves audiences by slug and rejects unknown slugs", () => {
    for (const audience of audiences) {
      expect(getAudience(audience.slug)).toBe(audience);
    }
    expect(getAudience("missing-audience")).toBeUndefined();
  });

  it("only references example goals that exist, at least one per audience", () => {
    const goalIds = new Set(exampleGoalItems.map((goal) => goal.id));
    for (const audience of audiences) {
      expect(audience.exampleGoalIds.length).toBeGreaterThan(0);
      for (const id of audience.exampleGoalIds) {
        expect(goalIds.has(id), `${audience.slug} → goal "${id}"`).toBe(true);
      }
      expect(getAudienceExampleGoals(audience)).toHaveLength(
        audience.exampleGoalIds.length,
      );
    }
  });

  it("cross-links only to other existing audiences", () => {
    for (const audience of audiences) {
      expect(audience.related.length).toBeGreaterThan(0);
      for (const related of audience.related) {
        expect(related).not.toBe(audience.slug);
        expect(
          audienceSlugs.includes(related),
          `${audience.slug} → related "${related}"`,
        ).toBe(true);
      }
    }
  });

  it("documents a distinct SEO keyword and a localisable image for every audience", () => {
    const keywords = new Set<string>();
    for (const audience of audiences) {
      expect(audience.seoKeyword.length).toBeGreaterThan(0);
      keywords.add(audience.seoKeyword);
      // Image alt text must be localisable via the content namespace.
      expect(audience.image.altKey, `${audience.slug} image altKey`).toMatch(
        /^imageAlt\./,
      );
    }
    expect(keywords.size).toBe(audiences.length);
  });

  it("has complete English copy for every audience", () => {
    for (const audience of audiences) {
      const id = audience.id;
      for (const key of ["label", "tagline", "heading", "intro"]) {
        expectString(`${id}.${key}`);
      }
      expectString(`meta.${id}.title`);
      expectString(`meta.${id}.description`);
      expectString(`${id}.value.heading`);
      for (const item of ["one", "two", "three"]) {
        expectString(`${id}.value.items.${item}`);
      }
      for (const step of ["createPage", "shareGoal", "momentum"]) {
        expectString(`${id}.how.steps.${step}.title`);
        expectString(`${id}.how.steps.${step}.body`);
      }
      for (const faq of ["q1", "q2", "q3"]) {
        expectString(`${id}.faqs.${faq}.question`);
        expectString(`${id}.faqs.${faq}.answer`);
      }
      expectString(`${id}.cta.heading`);
      expectString(`${id}.cta.body`);
    }
  });

  it("keeps the junior page guardian-led with dedicated guardian copy", () => {
    const junior = getAudience("junior-golfers");
    expect(junior?.guardianLed).toBe(true);
    expectString("juniorGolfers.guardian.heading");
    expectString("juniorGolfers.guardian.body");
    // No other audience is guardian-led — the flag drives the notice section.
    for (const audience of audiences as readonly Audience[]) {
      if (audience.slug !== "junior-golfers") {
        expect(audience.guardianLed).toBeUndefined();
      }
    }
  });
});
