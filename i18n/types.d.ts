import type { Messages } from "./en";
import type { AppLocale } from "./locales";

/**
 * Typed message keys: `useTranslations`/`getTranslations` calls are checked
 * against the English source catalog, so an invalid key fails `tsc`.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: Messages;
  }
}
