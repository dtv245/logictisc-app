/**
 * Changes tenant only through a fresh Identity Server authentication. The SPA
 * never sends a tenant header or calls an invented tenant-switch endpoint.
 */

import { useCallback } from "react";
import { useGo, useLogin } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";

import { env } from "@config/env";
import { routes } from "@constants/routes";
import { useCurrentUser } from "./useCurrentUser";

interface TenantReauthenticationParams {
  mode: "redirect";
  returnTo: string;
  forceReauthentication: true;
}

const isTenantScopedQuery = (queryKey: readonly unknown[]): boolean =>
  ["data", "access", "auth"].includes(String(queryKey[0]));

/**
 * Buộc cấp token mới khi người dùng muốn đổi tenant.
 *
 * Hook cố ý không nhận tenant id: SPA chỉ thể hiện ý định xác thực lại, còn
 * Identity Server quyết định tenant hợp lệ và ghi tenant đó vào access token.
 */
export const useSwitchTenant = () => {
  const currentUser = useCurrentUser();
  const go = useGo();
  const login = useLogin<TenantReauthenticationParams>();
  const queryClient = useQueryClient();

  const switchTenant = useCallback(
    async () => {
      if (env.demoAuth) {
        // Demo chỉ có một tenant cố định, nên không cần tạo OIDC redirect.
        go({ to: routes.dashboard, type: "replace" });
        return;
      }

      // Dừng request cũ trước khi xóa cache để response tenant hiện tại không
      // kịp ghi dữ liệu trở lại trong lúc browser đang chuyển sang IdP.
      await queryClient.cancelQueries({
        predicate: (query) => isTenantScopedQuery(query.queryKey),
      });
      queryClient.removeQueries({
        predicate: (query) => isTenantScopedQuery(query.queryKey),
      });

      // createAuthProvider sẽ clear session và bắt đầu authorization-code flow
      // khi nhận forceReauthentication.
      await login.mutateAsync({
        mode: "redirect",
        returnTo: routes.dashboard,
        forceReauthentication: true,
      });
    },
    [go, login, queryClient],
  );

  return {
    error: login.error,
    isError: login.isError,
    isLoading: login.isLoading,
    switchTenant,
    currentTenantId: currentUser.data?.tenantId,
  };
};
