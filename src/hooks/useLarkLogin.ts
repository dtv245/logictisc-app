/**
 * Đóng gói hai pha redirect/callback của đăng nhập Lark.
 */

import { useCallback } from "react";
import {
  useLogin,
  type AuthActionResponse,
  type RefineError,
} from "@refinedev/core";
import type { UseMutationResult } from "@tanstack/react-query";

import type { LarkLoginParams } from "../types/auth.types";

/**
 * Viết tay thay vì `ReturnType<typeof useLogin<LarkLoginParams>>`: `useLogin` là hàm
 * overload nên instantiation expression rơi vào overload **cuối** (bản combined), làm
 * `data` nới thành `AuthActionResponse | TLoginData`. Callback page đọc `data.success`
 * sẽ vỡ. Đây là nhánh `UseLoginProps`.
 */
export type UseLarkLoginResult = UseMutationResult<
  AuthActionResponse,
  Error | RefineError,
  LarkLoginParams,
  unknown
> & {
  /** Pha callback: đổi code lấy phiên đăng nhập. */
  completeLogin: () => void;
  /** Pha redirect: bắt đầu authorization-code flow. */
  startLogin: (returnTo?: string) => void;
};

export const useLarkLogin = (): UseLarkLoginResult => {
  // useLogin chuyển toàn bộ mutation lifecycle qua AuthProvider.
  const login = useLogin<LarkLoginParams>();

  // Callback ổn định để effect ở callback page không chạy lại do identity hàm.
  // returnTo là đường dẫn nội bộ cần khôi phục sau callback; provider sẽ chuẩn
  // hóa và chặn absolute URL trước khi dùng.
  const startLogin = useCallback(
    (returnTo?: string) => {
      login.mutate(
        returnTo ? { mode: "redirect", returnTo } : { mode: "redirect" },
      );
    },
    [login],
  );

  const completeLogin = useCallback(() => {
    login.mutate({ mode: "callback" });
  }, [login]);

  return {
    ...login,
    completeLogin,
    startLogin,
  };
};
