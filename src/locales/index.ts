export * from "./vi";
export * from "./en";
export * from "./ja";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { viMessages } from "./vi";
import { enMessages } from "./en";
import { jaMessages } from "./ja";

export const initializeAppI18n = async ({
  locale,
  fallbackLocale,
}: {
  locale: string;
  fallbackLocale: string;
}) => {
  await i18n.use(initReactI18next).init({
    resources: {
      vi: { translation: viMessages },
      en: { translation: enMessages },
      ja: { translation: jaMessages },
    },
    lng: locale,
    fallbackLng: fallbackLocale,
    defaultNS: "translation",
    interpolation: { escapeValue: false },
  });
  return i18n;
};
export type SupportedLocale = "vi" | "en" | "ja";
