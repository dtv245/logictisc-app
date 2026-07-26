/**
 * Gắn tenant header và chuẩn hóa lỗi cho Axios client.
 */

import type { AxiosInstance } from "axios";

import { env } from "../../config/env";
import { normalizeApiError } from "./errors";
import { getActiveTenantKey } from "./tenantSession";

export const attachInterceptors = (client: AxiosInstance): AxiosInstance => {
  client.interceptors.request.use((config) => {
    const tenantKey = getActiveTenantKey();

    if (tenantKey) {
      config.headers.set(env.tenantHeaderName, tenantKey);
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(normalizeApiError(error)),
  );

  return client;
};
