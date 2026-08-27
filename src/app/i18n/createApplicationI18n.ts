/**
 * Composes the shared translator with application bootstrap resources.
 */

import {
  createAppI18n,
  initializeAppI18n,
  supportedLocales,
  type I18nBootstrapOptions,
} from "@shared/i18n";
import type { i18n } from "i18next";

import {
  APP_I18N_NAMESPACE,
  appI18nResources,
} from "./resources";

function registerApplicationResources(instance: i18n): void {
  for (const locale of supportedLocales) {
    instance.addResourceBundle(
      locale,
      APP_I18N_NAMESPACE,
      appI18nResources[locale][APP_I18N_NAMESPACE],
      true,
      true,
    );
  }
}

export async function createApplicationI18n(
  options: I18nBootstrapOptions,
): Promise<i18n> {
  const instance = await createAppI18n(options);
  registerApplicationResources(instance);
  return instance;
}

export async function initializeApplicationI18n(
  options: I18nBootstrapOptions,
): Promise<i18n> {
  const instance = await initializeAppI18n(options);
  registerApplicationResources(instance);
  return instance;
}
