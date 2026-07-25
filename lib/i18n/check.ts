/**
 * Translation parity checks — pure functions shared by the CLI
 * (scripts/i18n-check.mjs) and the vitest suite (test/i18n-parity.test.ts).
 *
 * English is the source catalog; every other locale is compared against it.
 */

export type FlatMessages = Record<string, string>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Flatten a nested message object into dot-path → string leaf values. */
export function flattenMessages(
  messages: unknown,
  prefix = "",
): { flat: FlatMessages; invalidTypes: string[] } {
  const flat: FlatMessages = {};
  const invalidTypes: string[] = [];

  function walk(node: unknown, path: string) {
    if (typeof node === "string") {
      flat[path] = node;
      return;
    }
    if (isRecord(node)) {
      for (const [key, value] of Object.entries(node)) {
        walk(value, path ? `${path}.${key}` : key);
      }
      return;
    }
    // Arrays, numbers, booleans, null — not valid message values.
    invalidTypes.push(path);
  }

  walk(messages, prefix);
  return { flat, invalidTypes };
}

export function findMissingKeys(
  source: FlatMessages,
  target: FlatMessages,
): string[] {
  return Object.keys(source).filter((key) => !(key in target));
}

export function findExtraKeys(
  source: FlatMessages,
  target: FlatMessages,
): string[] {
  return Object.keys(target).filter((key) => !(key in source));
}

export function findEmptyValues(messages: FlatMessages): string[] {
  return Object.entries(messages)
    .filter(([, value]) => value.trim() === "")
    .map(([key]) => key);
}

/**
 * Extract ICU argument names (and plural/select usage) from a message.
 * Handles `{name}`, `{count, plural, …}`, `{kind, select, …}` forms.
 *
 * Parses brace nesting so that literal words inside plural/select branches
 * (e.g. `one {goal}`) are not mistaken for arguments, while genuinely nested
 * arguments inside branch sub-messages are still collected.
 */
export function icuArguments(message: string): Set<string> {
  const args = new Set<string>();
  collectIcuArguments(message, args);
  return args;
}

/** Index of the `}` matching the `{` at `openIndex`, or -1 if unbalanced. */
function matchingBrace(message: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < message.length; i++) {
    if (message[i] === "{") depth++;
    else if (message[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

function collectIcuArguments(message: string, args: Set<string>): void {
  for (let i = 0; i < message.length; i++) {
    if (message[i] !== "{") continue;
    const end = matchingBrace(message, i);
    if (end === -1) return; // unbalanced — nothing more to parse safely
    const inner = message.slice(i + 1, end);
    const comma = inner.indexOf(",");
    const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    if (/^[a-zA-Z0-9_]+$/.test(name)) args.add(name);
    if (comma !== -1) {
      // plural/select/etc: recurse into each `{…}` branch sub-message.
      const rest = inner.slice(comma + 1);
      let depth = 0;
      let start = -1;
      for (let j = 0; j < rest.length; j++) {
        if (rest[j] === "{") {
          if (depth === 0) start = j + 1;
          depth++;
        } else if (rest[j] === "}" && depth > 0 && --depth === 0) {
          collectIcuArguments(rest.slice(start, j), args);
        }
      }
    }
    i = end;
  }
}

export type IcuMismatch = {
  key: string;
  sourceArgs: string[];
  targetArgs: string[];
};

/**
 * A translation must use exactly the interpolation variables the English
 * source defines — a missing `{amount}` in German is a rendering bug.
 */
export function findIcuMismatches(
  source: FlatMessages,
  target: FlatMessages,
): IcuMismatch[] {
  const mismatches: IcuMismatch[] = [];
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key];
    if (targetValue === undefined) continue;
    const sourceArgs = [...icuArguments(sourceValue)].sort();
    const targetArgs = [...icuArguments(targetValue)].sort();
    if (sourceArgs.join("|") !== targetArgs.join("|")) {
      mismatches.push({ key, sourceArgs, targetArgs });
    }
  }
  return mismatches;
}

/**
 * JSON.parse silently keeps the last duplicate key, so duplicates must be
 * detected on the raw text. Tokenises every string (so braces inside ICU
 * message values don't confuse depth tracking) and checks keys per object.
 */
export function findDuplicateKeys(rawJson: string): string[] {
  const duplicates: string[] = [];
  const keysPerObject: Array<Set<string>> = [];

  // Strings are consumed whole; only a string directly followed by ":" is a key.
  const tokens =
    rawJson.match(/"(?:[^"\\]|\\.)*"\s*:?|\{|\}|\[|\]/g) ?? [];
  for (const token of tokens) {
    if (token === "{") {
      keysPerObject.push(new Set());
    } else if (token === "}") {
      keysPerObject.pop();
    } else if (token === "[" || token === "]") {
      continue;
    } else if (token.trimEnd().endsWith(":")) {
      const key = token.slice(1, token.lastIndexOf('"'));
      const scope = keysPerObject[keysPerObject.length - 1];
      if (scope) {
        if (scope.has(key)) duplicates.push(key);
        scope.add(key);
      }
    }
  }
  return duplicates;
}

export type LocaleReport = {
  locale: string;
  missingKeys: string[];
  extraKeys: string[];
  emptyValues: string[];
  icuMismatches: IcuMismatch[];
  invalidTypes: string[];
  missingNamespaces: string[];
  extraNamespaces: string[];
};

export function hasErrors(
  report: LocaleReport,
  options: { missingIsError: boolean },
): boolean {
  return (
    (options.missingIsError &&
      (report.missingKeys.length > 0 ||
        report.missingNamespaces.length > 0)) ||
    report.extraKeys.length > 0 ||
    report.emptyValues.length > 0 ||
    report.icuMismatches.length > 0 ||
    report.invalidTypes.length > 0 ||
    report.extraNamespaces.length > 0
  );
}
