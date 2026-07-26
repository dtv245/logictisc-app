/**
 * Suy ra tenant hiện tại từ identity đã được AuthProvider xác nhận.
 */

import { useMemo } from "react";

import type { Tenant } from "../types/tenant";
import { useCurrentUser } from "./useCurrentUser";

export const useCurrentTenant = () => {
  const currentUser = useCurrentUser();
  // Memo hóa vì layout đọc tenant ở nhiều nơi trong cùng render tree.
  const tenant = useMemo<Tenant | undefined>(() => {
    const user = currentUser.data;
    if (!user?.tenantKey) {
      return undefined;
    }

    return (
      user.tenants?.find((item) => item.tenantKey === user.tenantKey) ?? {
        id: user.tenantKey,
        tenantKey: user.tenantKey,
        tenantName: user.tenantName ?? user.tenantKey,
      }
    );
  }, [currentUser.data]);

  return {
    tenant,
    error: currentUser.error,
    isLoading: currentUser.isLoading,
    refetch: currentUser.refetch,
  };
};
