/**
 * Ngôn ngữ đang dùng, đã quy đổi sang thẻ BCP-47 mà `Intl` hiểu.
 *
 * i18next trả về mã rút gọn ("vi", "en", "ja"); `Intl.NumberFormat` cần thẻ
 * đầy đủ nên phải qua `toIntlLocale`. Bọc lại thành hook để không nơi nào
 * quên bước quy đổi này.
 */

import { useTranslation } from "react-i18next";

import { toIntlLocale } from "@formatters/intlLocale";

export const useIntlLocale = (): string => {
  const { i18n } = useTranslation();
  return toIntlLocale(i18n.language);
};
