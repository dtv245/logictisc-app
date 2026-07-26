/**
 * Đăng xuất và dọn các query chứa dữ liệu tenant/auth.
 */

import { useCallback } from "react";
import { useLogout } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";

export const useLogoutUser = () => {
  // useLogout bảo đảm Refine áp dụng redirect và auth lifecycle chuẩn.
  const logout = useLogout();
  const queryClient = useQueryClient();

  // Callback dọn cache sau mutation thành công để tenant trước không rò dữ liệu.
  const logoutUser = useCallback(async () => {
    const result = await logout.mutateAsync();

    if (result.success) {
      queryClient.removeQueries({
        predicate: (query) =>
          ["data", "access", "auth"].includes(String(query.queryKey[0])),
      });
    }

    return result;
  }, [logout, queryClient]);

  return {
    ...logout,
    logoutUser,
  };
};
