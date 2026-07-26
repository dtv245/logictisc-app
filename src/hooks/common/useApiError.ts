import { useCallback } from "react";
import { App } from "antd";

import { normalizeApiError } from "../../api/errors";

export const useApiError = () => {
  const { notification } = App.useApp();

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
