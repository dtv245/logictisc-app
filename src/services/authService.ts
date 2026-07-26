import type { CurrentUser, PasswordLoginParams } from "../types/auth";
import { readAccessToken } from "./authSession";
import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import { adaptRecordResponse } from "../api/responseAdapter";
import {
  clearActiveTenantKey,
  setActiveTenantKey,
} from "../api/tenantSession";
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
