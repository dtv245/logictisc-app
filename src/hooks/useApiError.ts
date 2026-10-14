/**
 * Chuẩn hóa và hiển thị API error qua Ant Design App context.
 */

import { useCallback } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";

import type { ApiHttpError } from "@/utils/httpError";
import { normalizeHttpError } from "@/utils/httpError";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

export interface UseApiErrorResult {
  /** Chuẩn hoá lỗi, hiện notification, và trả về lỗi đã chuẩn hoá để gọi tiếp. */
  showApiError: (error: unknown) => ApiHttpError;
}

export const useApiError = (): UseApiErrorResult => {
  const { notification } = App.useApp();
  const { t } = useTranslation();

  // Callback ổn định để có thể truyền thẳng vào Promise.catch ở UI actions.
  const showApiError = useCallback(
    (error: unknown) => {
      const apiError = normalizeHttpError(error);
      const { key, message, description } = createApiErrorNotification(apiError, t);
      notification.error({ key, message, description });
      return apiError;
    },
    [notification, t],
  );

  return { showApiError };
};
