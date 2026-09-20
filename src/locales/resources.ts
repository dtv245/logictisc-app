/**
 * Declares the supported locale catalogue and the shared i18n namespace.
 *
 * Feature namespaces can be merged by the application bootstrap without
 * changing the shared component contract.
 */
import { enSharedMessages } from "./locales/en";
import { viSharedMessages } from "./locales/vi";

export const SHARED_I18N_NAMESPACE = "shared";

export const sharedI18nResources = {
  en: {
    [SHARED_I18N_NAMESPACE]: enSharedMessages,
  },
  vi: {
    [SHARED_I18N_NAMESPACE]: viSharedMessages,
  },
} as const;

export type SupportedLocale = keyof typeof sharedI18nResources;

export const supportedLocales = Object.freeze(
  ["en", "vi"] satisfies SupportedLocale[],
);
