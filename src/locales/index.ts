export * from "./vi";
export * from "./en";
export * from "./ja";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { viMessages } from "./vi";
import { enMessages } from "./en";
import { jaMessages } from "./ja";

/** The single resource catalog used by the app and browser test fixtures. */
export const appI18nResources = {
  vi: { translation: viMessages },
  en: { translation: enMessages },
  ja: { translation: jaMessages },
} as const;

/** Render an explicit fallback for data-derived keys that are not guaranteed
 * to exist in the locale catalog (for example, an enum added by the backend).
 * Required UI copy should call `t` directly so strict test initialization fails
 * when its translation is missing.
 */
export const translateOptional = <T>(
  i18nInstance: { exists: (key: string) => boolean },
  translate: (key: string) => T,
  key: string,
  fallback: T,
): T => (i18nInstance.exists(key) ? translate(key) : fallback);

export const initializeAppI18n = async ({
  locale,
  fallbackLocale,
  strictMissingKeys,
}: {
  locale: string;
  fallbackLocale: string;
  strictMissingKeys?: boolean;
}) => {
  const shouldFailOnMissingKey =
    strictMissingKeys ?? import.meta.env.MODE === "test";

  await i18n.use(initReactI18next).init({
    resources: appI18nResources,
    lng: locale,
    fallbackLng: fallbackLocale,
    defaultNS: "translation",
    interpolation: { escapeValue: false },
    parseMissingKeyHandler: shouldFailOnMissingKey
      ? (key, defaultValue) => {
          if (defaultValue !== undefined && defaultValue !== key) {
            return defaultValue;
          }
          throw new Error(`[i18n] Missing translation key: ${key}`);
        }
      : undefined,
  });
  return i18n;
};
export type SupportedLocale = "vi" | "en" | "ja";

export const resolveSupportedLocale = (locale: string | undefined): SupportedLocale =>
  locale?.startsWith("ja") ? "ja" : locale?.startsWith("en") ? "en" : "vi";

export const createLocaleLabels = <T extends readonly string[]>(
  translate: (key: string) => string,
  prefix: string,
  keys: T,
): Record<T[number], string> => Object.fromEntries(
  keys.map((key) => [key, translate(`${prefix}.${key}`)]),
) as Record<T[number], string>;
