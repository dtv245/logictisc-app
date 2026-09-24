/**
 * Dịch ngoài cây React, cho các module thuần TS (factory provider, định nghĩa form).
 *
 * Trong component luôn dùng `useTranslation` để re-render khi đổi ngôn ngữ; helper
 * này chỉ dành cho ngữ cảnh chạy sau khi i18n đã khởi tạo và không cần re-render.
 */

import i18n from "i18next";

export const translate = (
  key: string,
  options?: Record<string, unknown>,
): string => i18n.t(key, options);
