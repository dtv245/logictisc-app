/**
 * Ánh xạ locale của ứng dụng (`vi` / `en` / `ja`) sang thẻ BCP-47 mà `Intl` cần.
 *
 * `Intl.NumberFormat` không chấp nhận mã ngôn ngữ trần cho mọi trường hợp, và
 * hardcode `vi-VN` sẽ khiến số tiền hiển thị sai định dạng khi đổi ngôn ngữ.
 */

const INTL_LOCALES: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  vi: "vi-VN",
};

export const toIntlLocale = (language: string): string =>
  INTL_LOCALES[language] ?? INTL_LOCALES.en;
