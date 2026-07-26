import { Navigate, Outlet } from "react-router-dom";

import { useCurrentUser } from "../hooks/auth/useCurrentUser";
import { FullPageLoader } from "./FullPageLoader";
import { routes } from "./routeConfig";

export const TenantGuard = () => {
  const currentUser = useCurrentUser();

  if (currentUser.isLoading) {
    return <FullPageLoader />;
  }

  if (!currentUser.data?.tenantKey) {
    return <Navigate to={routes.selectTenant} replace />;
  }

  return <Outlet />;
};
