/**
 * Creates and initializes i18next instances for the application bootstrap.
 *
 * The singleton initializer is idempotent for production, while the factory
 * keeps component tests isolated from global language state.
 */
import i18next, {
  createInstance,
  type InitOptions,
  type i18n,
} from "i18next";
import { initReactI18next } from "react-i18next";

import {
  SHARED_I18N_NAMESPACE,
  sharedI18nResources,
  type SupportedLocale,
} from "./resources";

export interface I18nBootstrapOptions {
  locale: SupportedLocale;
  fallbackLocale?: SupportedLocale;
}

const createInitOptions = ({
  locale,
  fallbackLocale = "en",
}: I18nBootstrapOptions): InitOptions => ({
  resources: sharedI18nResources,
  lng: locale,
  fallbackLng: fallbackLocale,
  defaultNS: SHARED_I18N_NAMESPACE,
  ns: [SHARED_I18N_NAMESPACE],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export async function createAppI18n(
  options: I18nBootstrapOptions,
): Promise<i18n> {
  const instance = createInstance();
  instance.use(initReactI18next);
  await instance.init(createInitOptions(options));
  return instance;
}

export async function initializeAppI18n(
  options: I18nBootstrapOptions,
): Promise<i18n> {
  if (!i18next.isInitialized) {
    i18next.use(initReactI18next);
    await i18next.init(createInitOptions(options));
    return i18next;
  }

  if (i18next.language !== options.locale) {
    await i18next.changeLanguage(options.locale);
  }

  return i18next;
}
