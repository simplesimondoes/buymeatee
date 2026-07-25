import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";

import { enMessages } from "@/i18n/en";
import type { AppLocale } from "@/i18n/locales";

/**
 * Render a component inside a NextIntlClientProvider with the English source
 * catalog. Since English is the source of truth, existing English-string
 * assertions keep working unchanged.
 */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "en" as AppLocale } = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

/** For tests that need a wrapper (e.g. rerender with providers). */
export function IntlWrapper({
  children,
  locale = "en" as AppLocale,
}: {
  children: React.ReactNode;
  locale?: AppLocale;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
