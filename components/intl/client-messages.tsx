import { NextIntlClientProvider, useMessages } from "next-intl";

import type { Messages } from "@/i18n/en";

/**
 * Server component that provides a picked set of message namespaces to the
 * client components beneath it. The root layout only serializes `common`
 * into every page; feature areas wrap their client islands in this to add
 * exactly the namespaces they need — nothing more ships to the browser.
 *
 * `common` is always included because the inner provider replaces (not
 * merges) the outer context.
 */
export function ClientMessages({
  namespaces,
  children,
}: {
  namespaces: Array<keyof Messages>;
  children: React.ReactNode;
}) {
  const messages = useMessages();
  const picked = Object.fromEntries(
    [...new Set<keyof Messages>(["common", ...namespaces])].map((ns) => [
      ns,
      messages[ns],
    ]),
  );
  return (
    <NextIntlClientProvider messages={picked}>
      {children}
    </NextIntlClientProvider>
  );
}
