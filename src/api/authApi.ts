import type { CurrentUser } from "../types/auth";
import { endpoints } from "./endpoints";
import { httpClient } from "./httpClient";
import { adaptRecordResponse } from "./responseAdapter";
import { clearActiveTenantKey, setActiveTenantKey } from "./tenantSession";

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
    clearActiveTenantKey();
  }
};
