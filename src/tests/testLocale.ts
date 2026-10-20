import { initializeAppI18n, type SupportedLocale } from "@/locales";

/** Select a catalog locale for a test while keeping one resource catalog. */
export const setTestLocale = (locale: SupportedLocale = "en") =>
  initializeAppI18n({ locale, fallbackLocale: "en", strictMissingKeys: true });
