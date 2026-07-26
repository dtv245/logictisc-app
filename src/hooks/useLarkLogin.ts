/**
 * Đóng gói hai pha redirect/callback của đăng nhập Lark.
 */

import { useCallback } from "react";
import { useLogin } from "@refinedev/core";

import type { LarkLoginParams } from "../types/auth";

export const useLarkLogin = () => {
  // useLogin chuyển toàn bộ mutation lifecycle qua AuthProvider.
  const login = useLogin<LarkLoginParams>();

  // Callback ổn định để effect ở callback page không chạy lại do identity hàm.
  const startLogin = useCallback(() => {
    login.mutate({ mode: "redirect" });
  }, [login]);

  const completeLogin = useCallback(() => {
    login.mutate({ mode: "callback" });
  }, [login]);

  return {
    ...login,
    completeLogin,
    startLogin,
  };
};
