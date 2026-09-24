/**
 * Đăng xuất và dọn các query chứa dữ liệu tenant/auth.
 */

import { useCallback } from "react";
import {
  useLogout,
  type AuthActionResponse,
  type RefineError,
} from "@refinedev/core";
import type { UseMutationResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

/**
 * `useLogout()` không truyền props nên rơi vào nhánh `UseLogoutProps`; biến mutation
 * là `Variables | void` với `Variables = { redirectPath?: string | false }`.
 *
 * Viết tay thay vì `ReturnType<typeof useLogout>`: overload cuối (bản combined) trả
 * `AuthActionResponse | TLogoutData`, làm mất kiểu của `data.success` bên dưới.
 */
export type UseLogoutUserResult = UseMutationResult<
  AuthActionResponse,
  Error | RefineError,
  { redirectPath?: string | false } | void,
  unknown
> & {
  /** Đăng xuất rồi dọn cache tenant/auth; trả về kết quả của Refine. */
  logoutUser: () => Promise<AuthActionResponse>;
};

export const useLogoutUser = (): UseLogoutUserResult => {
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
