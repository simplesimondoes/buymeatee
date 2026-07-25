import { describe, expect, it } from "vitest";

import content from "@/messages/en/content.json";
import {
  exampleGoalItems,
  exampleGoals,
} from "@/lib/content/example-goals";
import { images } from "@/lib/content/images";
import {
  previewActivity,
  previewActivityItems,
  previewCreatorItems,
  previewCreators,
} from "@/lib/content/preview-creators";
import {
  supportOptionItems,
  supportOptions,
  supportOptionsNote,
  supportOptionsNoteKey,
} from "@/lib/content/support-options";

/**
 * The key-based items and the deprecated English-string exports must stay in
 * lockstep until consumers finish migrating: every referenced key resolves in
 * messages/en/content.json to exactly the string the old export carries.
 */

function resolve(key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      content,
    );
  expect(typeof value, `key "${key}" must resolve to a string`).toBe("string");
  return value as string;
}

describe("support options messages", () => {
  it("matches the deprecated English export", () => {
    expect(supportOptionItems).toHaveLength(supportOptions.length);
    supportOptionItems.forEach((item, index) => {
      const legacy = supportOptions[index];
      expect(item.icon).toBe(legacy.icon);
      expect(resolve(item.nameKey)).toBe(legacy.name);
      expect(resolve(item.descriptionKey)).toBe(legacy.description);
    });
    expect(resolve(supportOptionsNoteKey)).toBe(supportOptionsNote);
  });
});

describe("example goals messages", () => {
  it("matches the deprecated English export", () => {
    expect(exampleGoalItems).toHaveLength(exampleGoals.length);
    exampleGoalItems.forEach((item, index) => {
      const legacy = exampleGoals[index];
      expect(resolve(item.titleKey)).toBe(legacy.title);
      expect(resolve(item.creatorKey)).toBe(legacy.creator);
      expect(resolve(item.descriptionKey)).toBe(legacy.description);
      expect(item.raised).toBe(legacy.raised);
      expect(item.target).toBe(legacy.target);
      expect(item.image).toBe(legacy.image);
    });
  });
});

describe("preview creators messages", () => {
  it("matches the deprecated English export", () => {
    expect(previewCreatorItems).toHaveLength(previewCreators.length);
    previewCreatorItems.forEach((item, index) => {
      const legacy = previewCreators[index];
      expect(item.name).toBe(legacy.name);
      expect(item.category).toBe(legacy.category);
      expect(item.joined).toBe(legacy.joined);
      expect(item.image).toBe(legacy.image);
      expect(resolve(item.locationKey)).toBe(legacy.location);
      expect(resolve(item.countryKey)).toBe(legacy.country);
      expect(resolve(item.bioKey)).toBe(legacy.bio);
      expect(resolve(item.goal.titleKey)).toBe(legacy.goal.title);
      expect(resolve(item.goal.descriptionKey)).toBe(legacy.goal.description);
      expect(item.goal.raised).toBe(legacy.goal.raised);
      expect(item.goal.target).toBe(legacy.goal.target);
      if (legacy.updateNote) {
        expect(item.updateNoteKey).toBeDefined();
        expect(resolve(item.updateNoteKey as string)).toBe(legacy.updateNote);
      } else {
        expect(item.updateNoteKey).toBeUndefined();
      }
    });
  });

  it("has unique stable ids", () => {
    const ids = previewCreatorItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("preview activity messages", () => {
  it("matches the deprecated English export", () => {
    expect(previewActivityItems).toHaveLength(previewActivity.length);
    previewActivityItems.forEach((item, index) => {
      const legacy = previewActivity[index];
      expect(resolve(item.supporterKey)).toBe(legacy.supporter);
      expect(resolve(item.actionKey)).toBe(legacy.action);
      expect(resolve(item.targetKey)).toBe(legacy.target);
    });
  });
});

describe("image alt messages", () => {
  it("gives every image an altKey that resolves to its English alt", () => {
    for (const [id, image] of Object.entries(images)) {
      expect(image.altKey, `images.${id} altKey`).toBe(`imageAlt.${id}`);
      expect(resolve(image.altKey)).toBe(image.alt);
    }
  });
});
