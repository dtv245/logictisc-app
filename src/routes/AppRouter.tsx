import { lazy, Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { Navigate, Outlet, Route, Routes } from "react-router";

import { FullPageLoader } from "./FullPageLoader";
import { ProtectedRoute } from "./ProtectedRoute";
import { TenantGuard } from "./TenantGuard";
import { routes } from "./routeConfig";

const MainLayout = lazy(() =>
  import("../layouts/MainLayout").then((module) => ({
    default: module.MainLayout,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const LarkCallbackPage = lazy(() =>
  import("../pages/auth/LarkCallbackPage").then((module) => ({
    default: module.LarkCallbackPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../pages/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const SelectTenantPage = lazy(() =>
  import("../pages/tenant/SelectTenantPage").then((module) => ({
    default: module.SelectTenantPage,
  })),
);
const ForbiddenPage = lazy(() =>
  import("../pages/errors/ForbiddenPage").then((module) => ({
    default: module.ForbiddenPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../pages/errors/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

export const AppRouter = () => (
  <Suspense fallback={<FullPageLoader />}>
    <Routes>
    <Route
      element={
        <Authenticated
          key="guest"
          fallback={<Outlet />}
          loading={<FullPageLoader />}
        >
          <Navigate to={routes.dashboard} replace />
        </Authenticated>
      }
    >
      <Route path={routes.login} element={<LoginPage />} />
    </Route>

    <Route path={routes.callback} element={<LarkCallbackPage />} />
    <Route path={routes.forbidden} element={<ForbiddenPage />} />

    <Route element={<ProtectedRoute />}>
      <Route path={routes.selectTenant} element={<SelectTenantPage />} />

      <Route element={<TenantGuard />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to={routes.dashboard} replace />} />
          <Route path={routes.dashboard} element={<DashboardPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);
