import { useIsAuthenticated } from "@refinedev/core";

export const useAuthStatus = () => {
  const query = useIsAuthenticated();

  return {
    ...query,
    isAuthenticated: query.data?.authenticated === true,
  };
};
