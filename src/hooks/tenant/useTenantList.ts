import { useMemo } from "react";

import { useCurrentUser } from "../auth/useCurrentUser";

export const useTenantList = () => {
  const currentUser = useCurrentUser();
  const tenants = useMemo(
    () => currentUser.data?.tenants ?? [],
    [currentUser.data?.tenants],
  );

  return {
    tenants,
    error: currentUser.error,
    isLoading: currentUser.isLoading,
    refetch: currentUser.refetch,
  };
};
