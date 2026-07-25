import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { loadMessages } from "./load-messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    // Missing keys are already covered by the English deep-merge in
    // loadMessages; these hooks are a belt-and-braces last resort so a gap
    // can never crash a page or leak `undefined` into the UI.
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[i18n]", error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});
