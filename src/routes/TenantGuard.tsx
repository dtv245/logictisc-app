/**
 * Yêu cầu người dùng chọn tenant trước khi vào TMS routes.
 */

import { Navigate, Outlet } from "react-router-dom";

import { useCurrentUser } from "../hooks/useCurrentUser";
import { FullPageLoader } from "./FullPageLoader";
import { routes } from "../constants/routes";

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
