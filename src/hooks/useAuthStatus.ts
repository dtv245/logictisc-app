/**
 * Chuẩn hóa kết quả kiểm tra authenticated state của Refine.
 */

import { useIsAuthenticated } from "@refinedev/core";

export const useAuthStatus = () => {
  // Refine quản lý cache và lifecycle của auth check thay cho state cục bộ.
  const query = useIsAuthenticated();

  return {
    ...query,
    isAuthenticated: query.data?.authenticated === true,
  };
};
