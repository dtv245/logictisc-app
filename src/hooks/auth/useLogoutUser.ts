import { useCallback } from "react";
import { useLogout } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";

export const useLogoutUser = () => {
  const logout = useLogout();
  const queryClient = useQueryClient();

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
