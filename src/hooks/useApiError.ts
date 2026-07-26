/**
 * Chuẩn hóa và hiển thị API error qua Ant Design App context.
 */

import { useCallback } from "react";
import { App } from "antd";

import { normalizeApiError } from "../services/http/errors";

export const useApiError = () => {
  const { notification } = App.useApp();

  // Callback ổn định để có thể truyền thẳng vào Promise.catch ở UI actions.
  const showApiError = useCallback(
    (error: unknown) => {
      const apiError = normalizeApiError(error);
      notification.error({
        message: `Lỗi ${apiError.statusCode}`,
        description: apiError.message,
      });
      return apiError;
    },
    [notification],
  );

  return { showApiError };
};
