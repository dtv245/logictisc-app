/**
 * Chặn route yêu cầu phiên đăng nhập hợp lệ.
 */

import { Authenticated } from "@refinedev/core";
import { Outlet } from "react-router-dom";

import { FullPageLoader } from "./FullPageLoader";

export const ProtectedRoute = () => (
  <Authenticated
    key="protected"
    redirectOnFail
    loading={<FullPageLoader />}
  >
    <Outlet />
  </Authenticated>
);
