import { useCallback } from "react";
import { useLogin } from "@refinedev/core";

import type { LarkLoginParams } from "../../types/auth";

export const useLarkLogin = () => {
  const login = useLogin<LarkLoginParams>();

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
