/**
 * Chuyển tenant qua custom mutation và làm mới tenant-scoped queries.
 */

import { useCallback } from "react";
import {
  useCustomMutation,
  useGo,
  usePermissions,
} from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";

import { endpoints } from "../services/http/endpoints";
import { ApiHttpError } from "../services/http/errors";
import { setActiveTenantKey } from "../services/http/tenantSession";
import type { ApiError } from "../types/api";
import type {
  SwitchTenantRequest,
  SwitchTenantResult,
} from "../types/tenant";
import { useCurrentUser } from "./useCurrentUser";
import { routes } from "../constants/routes";

const isTenantScopedQuery = (queryKey: readonly unknown[]): boolean =>
  ["data", "access", "auth"].includes(String(queryKey[0]));

export const useSwitchTenant = () => {
  // Custom mutation đi qua DataProvider vì switch tenant là domain action,
  // không phải CRUD của một resource.
  const mutation = useCustomMutation<
    SwitchTenantResult,
    ApiError,
    SwitchTenantRequest
  >();
  const currentUser = useCurrentUser();
  const permissions = usePermissions<string[]>({});
  const queryClient = useQueryClient();
  const go = useGo();

  // Callback tuần tự hóa mutation, cache invalidation và identity verification.
  const switchTenant = useCallback(
    async (tenantKey: string) => {
      await mutation.mutateAsync({
        url: endpoints.tenant.switch,
        method: "post",
        values: { tenantKey },
        meta: { allowEmptyResponse: true },
        successNotification: {
          type: "success",
          message: "Đã chuyển công ty",
        },
      });

      setActiveTenantKey(tenantKey);

      await queryClient.cancelQueries({
        predicate: (query) => isTenantScopedQuery(query.queryKey),
      });
      queryClient.removeQueries({
        predicate: (query) =>
          ["data", "access"].includes(String(query.queryKey[0])),
      });
      await queryClient.resetQueries({ queryKey: ["auth"] });

      const [identityResult] = await Promise.all([
        currentUser.refetch(),
        permissions.refetch(),
      ]);

      if (identityResult.data?.tenantKey !== tenantKey) {
        throw new ApiHttpError(
          403,
          "Backend chưa xác nhận quyền thành viên của công ty đã chọn.",
        );
      }

      go({ to: routes.dashboard, type: "replace" });
    },
    [currentUser, go, mutation, permissions, queryClient],
  );

  return {
    ...mutation,
    switchTenant,
  };
};
