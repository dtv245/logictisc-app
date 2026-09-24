/**
 * Đọc identity hiện tại từ AuthProvider với cache ngắn hạn.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import { useGetIdentity } from "@refinedev/core";

import type { CurrentUser } from "../types/auth.types";

/**
 * Kiểu trả về của `useGetIdentity<CurrentUser>` (nhánh overload `UseGetIdentityProps`).
 *
 * Viết tay thay vì `ReturnType<typeof useGetIdentity<CurrentUser>>`: `useGetIdentity`
 * là hàm overload, mà instantiation expression chỉ lấy được overload **cuối cùng**.
 * Hệ quả là `data` bị thu về `{}` và mọi consumer (`AppHeader`, `TenantGuard`,
 * `DashboardPage`…) mất sạch kiểu của identity.
 */
export type UseCurrentUserResult = UseQueryResult<CurrentUser, unknown>;

// Identity được cache để các layout components không gọi `/auth/me` lặp lại.
export const useCurrentUser = (): UseCurrentUserResult =>
  useGetIdentity<CurrentUser>({
    queryOptions: {
      staleTime: 30_000,
    },
  });
