import type { AppLocale } from "./locales";
import { enMessages, messageNamespaces, type Messages } from "./en";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge locale messages over the English base. Every key missing from a
 * locale therefore renders its English content — users never see raw keys or
 * `undefined`, and the parity checker (lib/i18n/check.ts) reports the gap.
 */
export function mergeMessages(base: unknown, override: unknown): unknown {
  if (!isRecord(base) || !isRecord(override)) {
    return override === undefined ? base : override;
  }
  const merged: UnknownRecord = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in merged ? mergeMessages(merged[key], value) : value;
  }
  return merged;
}

async function importNamespace(
  locale: AppLocale,
  namespace: string,
): Promise<unknown> {
  try {
    const mod = (await import(`@/messages/${locale}/${namespace}.json`)) as {
      default: unknown;
    };
    return mod.default;
  } catch {
    // Missing namespace file for this locale: English base covers it.
    return undefined;
  }
}

/**
 * Load the full message catalog for a locale, deep-merged over English.
 * Pure of request context — usable from the request config, email rendering,
 * scripts and tests.
 */
export async function loadMessages(locale: AppLocale): Promise<Messages> {
  if (locale === "en") return enMessages;

  const merged: UnknownRecord = {};
  for (const namespace of messageNamespaces) {
    const override = await importNamespace(locale, namespace);
    merged[namespace] = mergeMessages(
      enMessages[namespace],
      override,
    ) as UnknownRecord;
  }
  return merged as Messages;
}
