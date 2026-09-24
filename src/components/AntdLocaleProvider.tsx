/**
 * Nạp locale dựng sẵn của antd theo ngôn ngữ đang chọn.
 *
 * Thiếu bước này thì mọi text do antd tự sinh — "No data" của Table, phân trang,
 * "Not Found" của Select rỗng, nút của Popconfirm — luôn là tiếng Anh, kể cả khi
 * người dùng đã chọn tiếng Việt. Chỉ text của *dự án* đi qua i18next; text của
 * *antd* phải đi qua `ConfigProvider.locale`.
 *
 * `i18n.language` có thể là "en-US" nên phải cắt theo dấu gạch, không so khớp tuyệt đối.
 */

import { ConfigProvider } from "antd";
import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import jaJP from "antd/locale/ja_JP";
import viVN from "antd/locale/vi_VN";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

const ANTD_LOCALES: Record<string, Locale> = {
  en: enUS,
  ja: jaJP,
  vi: viVN,
};

export const AntdLocaleProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();

  const language = i18n.language.split("-")[0];

  return (
    <ConfigProvider locale={ANTD_LOCALES[language] ?? ANTD_LOCALES.en}>
      {children}
    </ConfigProvider>
  );
};
