import { Authenticated } from "@refinedev/core";
import { Outlet } from "react-router";

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
