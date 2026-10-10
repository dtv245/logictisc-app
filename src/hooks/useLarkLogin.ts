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

export interface LarkCompleteLoginArgs {
  code?: string;
  state?: string;
  returnTo?: string;
  error?: string;
  errorDescription?: string;
}

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
  completeLogin: (params?: LarkCompleteLoginArgs) => void;
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
      login.mutate({
        provider: "lark",
        mode: "redirect",
        ...(returnTo ? { returnTo } : {}),
      });
    },
    [login],
  );

  const completeLogin = useCallback(
    (callbackParams?: LarkCompleteLoginArgs) => {
      let code = callbackParams?.code;
      let state = callbackParams?.state;
      let returnTo = callbackParams?.returnTo;
      let error = callbackParams?.error;
      let errorDescription = callbackParams?.errorDescription;

      if (typeof window !== "undefined" && window.location?.search) {
        const searchParams = new URLSearchParams(window.location.search);
        code = code ?? searchParams.get("code") ?? undefined;
        state = state ?? searchParams.get("state") ?? undefined;
        returnTo = returnTo ?? searchParams.get("returnTo") ?? undefined;
        error = error ?? searchParams.get("error") ?? undefined;
        errorDescription =
          errorDescription ??
          searchParams.get("error_description") ??
          searchParams.get("errorDescription") ??
          undefined;
      }

      login.mutate({
        provider: "lark",
        mode: "callback",
        code,
        state,
        returnTo,
        error,
        errorDescription,
      });
    },
    [login],
  );

  return {
    ...login,
    completeLogin,
    startLogin,
  };
};
