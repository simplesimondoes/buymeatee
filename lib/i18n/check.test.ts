import { describe, expect, it } from "vitest";

import {
  findDuplicateKeys,
  findEmptyValues,
  findExtraKeys,
  findIcuMismatches,
  findMissingKeys,
  flattenMessages,
  icuArguments,
} from "./check";

describe("flattenMessages", () => {
  it("flattens nested objects into dot paths", () => {
    const { flat, invalidTypes } = flattenMessages(
      { a: { b: "x", c: { d: "y" } } },
      "ns",
    );
    expect(flat).toEqual({ "ns.a.b": "x", "ns.a.c.d": "y" });
    expect(invalidTypes).toEqual([]);
  });

  it("reports non-string leaf values", () => {
    const { invalidTypes } = flattenMessages({ a: 1, b: ["x"], c: null }, "ns");
    expect(invalidTypes).toEqual(["ns.a", "ns.b", "ns.c"]);
  });
});

describe("key comparison", () => {
  const en = { "a.x": "1", "a.y": "2" };
  it("finds missing and extra keys", () => {
    expect(findMissingKeys(en, { "a.x": "1" })).toEqual(["a.y"]);
    expect(findExtraKeys(en, { "a.x": "1", "a.z": "3" })).toEqual(["a.z"]);
  });
  it("finds empty values", () => {
    expect(findEmptyValues({ "a.x": "  ", "a.y": "ok" })).toEqual(["a.x"]);
  });
});

describe("icuArguments", () => {
  it("extracts simple and plural arguments", () => {
    expect([...icuArguments("{amount} raised by {count} supporters")]).toEqual([
      "amount",
      "count",
    ]);
    expect([
      ...icuArguments("{count, plural, one {# supporter} other {# supporters}}"),
    ]).toContain("count");
  });
});

describe("findIcuMismatches", () => {
  it("flags variable drift and accepts reordering", () => {
    const en = { k: "{amount} from {name}" };
    expect(findIcuMismatches(en, { k: "{name} schickte {amount}" })).toEqual(
      [],
    );
    expect(findIcuMismatches(en, { k: "{name} schickte etwas" })).toHaveLength(
      1,
    );
  });
});

describe("findDuplicateKeys", () => {
  it("detects duplicates within one object", () => {
    expect(findDuplicateKeys('{ "a": "1", "b": "2", "a": "3" }')).toEqual([
      "a",
    ]);
  });

  it("allows the same key in different objects", () => {
    expect(
      findDuplicateKeys('{ "x": { "a": "1" }, "y": { "a": "2" } }'),
    ).toEqual([]);
  });

  it("is not confused by braces inside ICU message values", () => {
    expect(
      findDuplicateKeys(
        '{ "a": "{count, plural, one {# tee} other {# tees}}", "b": "x" }',
      ),
    ).toEqual([]);
  });
});
