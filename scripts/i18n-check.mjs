/**
 * Translation parity checker (npm run i18n:check).
 *
 * Compares every locale's message files against the English source catalog:
 * missing keys, extra keys, empty strings, ICU variable mismatches, duplicate
 * JSON keys, invalid value types and namespace-set drift.
 *
 * Exit code 1 on any error. Missing keys are warnings for locales not yet
 * declared "complete" in messages/manifest.json, errors afterwards.
 *
 * Requires Node's type stripping (Node >= 22.6) because the check logic is
 * shared with the vitest suite via lib/i18n/check.ts.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  findDuplicateKeys,
  findEmptyValues,
  findExtraKeys,
  findIcuMismatches,
  findMissingKeys,
  flattenMessages,
  hasErrors,
} from "../lib/i18n/check.ts";
import { locales } from "../i18n/locales.ts";

const root = path.resolve(import.meta.dirname, "..");
const messagesDir = path.join(root, "messages");

const manifest = JSON.parse(
  readFileSync(path.join(messagesDir, "manifest.json"), "utf8"),
);
const completeLocales = new Set(manifest.complete ?? []);

function namespaceFiles(locale) {
  const dir = path.join(messagesDir, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();
}

function loadNamespace(locale, file) {
  const raw = readFileSync(path.join(messagesDir, locale, file), "utf8");
  return { raw, parsed: JSON.parse(raw) };
}

const enFiles = namespaceFiles("en");
if (enFiles.length === 0) {
  console.error("No English source namespaces found under messages/en.");
  process.exit(1);
}

const enCatalog = {};
let failed = false;

for (const file of enFiles) {
  const { raw, parsed } = loadNamespace("en", file);
  const namespace = file.replace(/\.json$/, "");
  const duplicates = findDuplicateKeys(raw);
  const { flat, invalidTypes } = flattenMessages(parsed, namespace);
  const empty = findEmptyValues(flat);
  if (duplicates.length || invalidTypes.length || empty.length) {
    failed = true;
    console.error(`✖ en/${file}:`);
    for (const key of duplicates) console.error(`    duplicate key: ${key}`);
    for (const key of invalidTypes)
      console.error(`    invalid value type at: ${key}`);
    for (const key of empty) console.error(`    empty string: ${key}`);
  }
  Object.assign(enCatalog, flat);
}

let warned = false;

for (const locale of locales) {
  if (locale === "en") continue;
  const files = namespaceFiles(locale);
  const missingNamespaces = enFiles.filter((f) => !files.includes(f));
  const extraNamespaces = files.filter((f) => !enFiles.includes(f));

  const localeCatalog = {};
  const invalidTypes = [];
  const duplicates = [];
  for (const file of files) {
    if (!enFiles.includes(file)) continue;
    const { raw, parsed } = loadNamespace(locale, file);
    const namespace = file.replace(/\.json$/, "");
    duplicates.push(...findDuplicateKeys(raw).map((k) => `${file}: ${k}`));
    const result = flattenMessages(parsed, namespace);
    invalidTypes.push(...result.invalidTypes);
    Object.assign(localeCatalog, result.flat);
  }

  const report = {
    locale,
    missingKeys: findMissingKeys(enCatalog, localeCatalog),
    extraKeys: findExtraKeys(enCatalog, localeCatalog),
    emptyValues: findEmptyValues(localeCatalog),
    icuMismatches: findIcuMismatches(enCatalog, localeCatalog),
    invalidTypes,
    missingNamespaces,
    extraNamespaces,
  };

  const missingIsError = completeLocales.has(locale);
  const errored = hasErrors(report, { missingIsError }) || duplicates.length;

  if (!errored && report.missingKeys.length === 0) {
    console.log(`✓ ${locale}: ${Object.keys(localeCatalog).length} keys, parity OK`);
    continue;
  }

  const log = errored ? console.error : console.warn;
  log(`${errored ? "✖" : "⚠"} ${locale}:`);
  if (report.missingNamespaces.length)
    log(
      `    missing namespaces (${missingIsError ? "error" : "warning"}): ${report.missingNamespaces.join(", ")}`,
    );
  if (report.extraNamespaces.length)
    log(`    extra namespaces: ${report.extraNamespaces.join(", ")}`);
  if (report.missingKeys.length)
    log(
      `    missing keys (${missingIsError ? "error" : "warning"}): ${report.missingKeys.length}` +
        (report.missingKeys.length <= 20
          ? ` → ${report.missingKeys.join(", ")}`
          : ` (first 20: ${report.missingKeys.slice(0, 20).join(", ")})`),
    );
  for (const key of report.extraKeys) log(`    extra key: ${key}`);
  for (const key of report.emptyValues) log(`    empty string: ${key}`);
  for (const m of report.icuMismatches)
    log(
      `    ICU mismatch at ${m.key}: en uses {${m.sourceArgs.join(", ")}} but ${locale} uses {${m.targetArgs.join(", ")}}`,
    );
  for (const key of report.invalidTypes) log(`    invalid value type at: ${key}`);
  for (const dup of duplicates) log(`    duplicate key in ${dup}`);

  if (errored) failed = true;
  else warned = true;
}

if (failed) {
  console.error("\ni18n:check failed.");
  process.exit(1);
}
console.log(warned ? "\ni18n:check passed with warnings." : "\ni18n:check passed.");
