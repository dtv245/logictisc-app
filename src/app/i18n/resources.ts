/**
 * Declares application-level resources separately from reusable shared copy.
 */

import type { SupportedLocale } from "@shared/i18n";

import { enAppMessages } from "./locales/en";
import { viAppMessages } from "./locales/vi";

export const APP_I18N_NAMESPACE = "app";

export const appI18nResources = {
  en: {
    [APP_I18N_NAMESPACE]: enAppMessages,
  },
  vi: {
    [APP_I18N_NAMESPACE]: viAppMessages,
  },
} as const satisfies Record<
  SupportedLocale,
  Record<typeof APP_I18N_NAMESPACE, object>
>;
