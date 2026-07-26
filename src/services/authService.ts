/**
 * Cung cấp các auth domain actions ngoài CRUD DataProvider.
 */

import type { CurrentUser, PasswordLoginParams } from "../types/auth";
import { readAccessToken } from "./authSession";
import { endpoints } from "./http/endpoints";
import { httpClient } from "./http/httpClient";
import { adaptRecordResponse } from "./http/responseAdapter";
import {
  clearActiveTenantKey,
  setActiveTenantKey,
} from "./http/tenantSession";
import { tokenStore } from "./tokenStore";

/**
 * Authentication endpoints are domain actions, not CRUD resources.
 * They intentionally live outside Refine's DataProvider and are consumed by
 * authProvider/accessControlProvider.
 */
export const login = async (
  credentials: PasswordLoginParams,
): Promise<void> => {
  const response = await httpClient.post<unknown>(
    endpoints.auth.login,
    credentials,
  );
  tokenStore.set(readAccessToken(response.data));
};

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await httpClient.get<unknown>(endpoints.auth.me);
  const user = adaptRecordResponse<CurrentUser>(response.data);
  setActiveTenantKey(user.tenantKey);
  return user;
};

export const logout = async (): Promise<void> => {
  try {
    await httpClient.post(endpoints.auth.logout);
  } finally {
    tokenStore.clear();
    clearActiveTenantKey();
  }
};
