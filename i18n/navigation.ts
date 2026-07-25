import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Use these instead of next/link and
 * next/navigation in all user-facing UI: hrefs stay bare ("/discover") and
 * the active locale prefix is added automatically.
 */
export const { Link, usePathname, useRouter, getPathname } =
  createNavigation(routing);

const navigation = createNavigation(routing);

/**
 * next-intl types its wrapped redirect as void; it actually throws (like
 * Next's own). Re-typed to `never` so auth guards narrow correctly.
 */
export const redirect: (
  ...args: Parameters<typeof navigation.redirect>
) => never = navigation.redirect as (
  ...args: Parameters<typeof navigation.redirect>
) => never;
