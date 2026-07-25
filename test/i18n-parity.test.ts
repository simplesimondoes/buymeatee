import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/locales";
import {
  findDuplicateKeys,
  findEmptyValues,
  findExtraKeys,
  findIcuMismatches,
  findMissingKeys,
  flattenMessages,
  type FlatMessages,
} from "@/lib/i18n/check";

const messagesDir = path.resolve(__dirname, "..", "messages");

const manifest = JSON.parse(
  readFileSync(path.join(messagesDir, "manifest.json"), "utf8"),
) as { complete?: string[] };
const completeLocales = new Set(manifest.complete ?? []);

function namespaceFiles(locale: string): string[] {
  const dir = path.join(messagesDir, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();
}

function loadCatalog(locale: string, files: string[]) {
  const catalog: FlatMessages = {};
  const problems: string[] = [];
  for (const file of files) {
    const raw = readFileSync(path.join(messagesDir, locale, file), "utf8");
    const namespace = file.replace(/\.json$/, "");
    for (const dup of findDuplicateKeys(raw)) {
      problems.push(`${locale}/${file}: duplicate key "${dup}"`);
    }
    const { flat, invalidTypes } = flattenMessages(JSON.parse(raw), namespace);
    for (const key of invalidTypes) {
      problems.push(`${locale}/${file}: invalid value type at "${key}"`);
    }
    Object.assign(catalog, flat);
  }
  return { catalog, problems };
}

const enFiles = namespaceFiles("en");
const en = loadCatalog("en", enFiles);

describe("translation parity", () => {
  it("has an English source catalog", () => {
    expect(enFiles.length).toBeGreaterThan(0);
    expect(en.problems).toEqual([]);
    expect(findEmptyValues(en.catalog)).toEqual([]);
  });

  for (const locale of locales) {
    if (locale === "en") continue;
    const files = namespaceFiles(locale);
    const target = loadCatalog(
      locale,
      files.filter((f) => enFiles.includes(f)),
    );

    describe(locale, () => {
      it("has no structural problems (duplicates, invalid types, empty strings)", () => {
        expect(target.problems).toEqual([]);
        expect(findEmptyValues(target.catalog)).toEqual([]);
      });

      it("has no extra keys or namespaces beyond the English source", () => {
        expect(files.filter((f) => !enFiles.includes(f))).toEqual([]);
        expect(findExtraKeys(en.catalog, target.catalog)).toEqual([]);
      });

      it("uses the exact ICU variables the English source defines", () => {
        expect(findIcuMismatches(en.catalog, target.catalog)).toEqual([]);
      });

      if (completeLocales.has(locale)) {
        it("is complete: full key parity with English", () => {
          expect(files).toEqual(enFiles);
          expect(findMissingKeys(en.catalog, target.catalog)).toEqual([]);
        });
      }
    });
  }
});
