/**
 * Trả danh sách tenant được phép truy cập từ identity hiện tại.
 */

import { useMemo } from "react";

import type { Tenant } from "../types/tenant.types";
import { useCurrentUser, type UseCurrentUserResult } from "./useCurrentUser";

export type UseTenantListResult = Pick<
  UseCurrentUserResult,
  "error" | "isLoading" | "refetch"
> & { tenants: Tenant[] };

export const useTenantList = (): UseTenantListResult => {
  const currentUser = useCurrentUser();
  // Giữ reference ổn định để Select/List không render lại khi query state khác đổi.
  const tenants = useMemo(
    () => currentUser.data?.tenants ?? [],
    [currentUser.data?.tenants],
  );

  return {
    tenants,
    error: currentUser.error,
    isLoading: currentUser.isLoading,
    refetch: currentUser.refetch,
  };
};
