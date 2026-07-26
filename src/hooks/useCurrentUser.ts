/**
 * Đọc identity hiện tại từ AuthProvider với cache ngắn hạn.
 */

import { useGetIdentity } from "@refinedev/core";

import type { CurrentUser } from "../types/auth";

// Identity được cache để các layout components không gọi `/auth/me` lặp lại.
export const useCurrentUser = () =>
  useGetIdentity<CurrentUser>({
    queryOptions: {
      staleTime: 30_000,
    },
  });
