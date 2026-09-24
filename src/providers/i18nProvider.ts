/**
 * Adapts an i18next translator to the Refine v4 `I18nProvider` contract.
 */

import type { I18nProvider } from "@refinedev/core";

export interface RefineI18nBridge {
  translate: (key: string, options?: Record<string, unknown>) => string;
  changeLanguage: (locale: string) => Promise<unknown>;
  getLanguage: () => string;
}

export const createRefineI18nProvider = ({
  translate,
  changeLanguage,
  getLanguage,
}: RefineI18nBridge): I18nProvider => ({
  // Refine truyền options theo kiểu tổng quát hơn i18next, vì vậy adapter là
  // nơi duy nhất chuyển kiểu thay vì rải ép kiểu ở từng màn hình.
  translate: (key, options) =>
    translate(key, options as Record<string, unknown> | undefined),
  changeLocale: changeLanguage,
  getLocale: getLanguage,
});