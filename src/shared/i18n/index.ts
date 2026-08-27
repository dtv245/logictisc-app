/**
 * Public exports for shared internationalization bootstrap and resources.
 */
export {
  createAppI18n,
  initializeAppI18n,
  type I18nBootstrapOptions,
} from "./createI18n";
export {
  SHARED_I18N_NAMESPACE,
  sharedI18nResources,
  supportedLocales,
  type SupportedLocale,
} from "./resources";
