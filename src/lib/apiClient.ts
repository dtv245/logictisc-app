/**
 * Holder cho Axios client dùng chung đã tạo trong `App.tsx`.
 *
 * Lý do không tạo client thứ hai: client hiện tại đã gắn token provider,
 * refresh/replay, tenant headers và envelope interceptor. API module mới chỉ
 * được lấy đúng instance này.
 */

import type { LogisticsApiClient } from "@/types/apiClient.types";

let currentClient: LogisticsApiClient | null = null;

export const setLogisticsApiClient = (client: LogisticsApiClient): void => {
  if (currentClient === client) {
    return;
  }

  currentClient = client;
};

export const getLogisticsApiClient = (): LogisticsApiClient => {
  if (!currentClient) {
    throw new Error("AI_DISPATCH_API_CLIENT_NOT_READY");
  }

  return currentClient;
};
