/**
 * Khai báo route tree cho auth, tenant guard và resource pages.
 */

import { createElement, lazy, Suspense, type ReactNode } from "react";
import { Authenticated, CanAccess } from "@refinedev/core";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { routes } from "@constants/routes";
import type { ReadyBootstrapState } from "@pages/diagnostics";
import { DiagnosticsPage } from "@pages/diagnostics";
import {
  appResourcePageRoutes,
  type ResourcePageRoute,
} from "@pages";
import { FullPageLoader } from "./FullPageLoader";
import { ProtectedRoute } from "./ProtectedRoute";
import { TenantGuard } from "./TenantGuard";

// Lazy-load các page lớn để auth/diagnostics shell không phải tải toàn bộ CRUD
// bundle trước khi biết người dùng được phép vào phần nghiệp vụ hay không.
const MainLayout = lazy(() =>
  import("@components").then((module) => ({
    default: module.AppLayout,
  })),
);
const LoginPage = lazy(() =>
  import("@pages/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const LarkCallbackPage = lazy(() =>
  import("@pages/auth/LarkCallbackPage").then((module) => ({
    default: module.LarkCallbackPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@pages/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const OperationsDashboardPage = lazy(() =>
  import("@pages/dashboard/OperationsDashboardPage").then((module) => ({
    default: module.OperationsDashboardPage,
  })),
);
const SelectTenantPage = lazy(() =>
  import("@pages/tenant/SelectTenantPage").then((module) => ({
    default: module.SelectTenantPage,
  })),
);
const ForbiddenPage = lazy(() =>
  import("@pages/errors/ForbiddenPage").then((module) => ({
    default: module.ForbiddenPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("@pages/errors/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

export interface AppRouterProps {
  diagnosticsState?: ReadyBootstrapState;
  resourcePageRoutes?: readonly ResourcePageRoute[];
}

interface ResourceAccessBoundaryProps {
  action: "create" | "edit" | "list" | "show";
  children: ReactNode;
  fallback?: ReactNode;
  resource: string;
}

/** Enforces Refine authorization even when a business URL is entered directly. */
export const ResourceAccessBoundary = ({
  action,
  children,
  fallback = <ForbiddenPage />,
  resource,
}: ResourceAccessBoundaryProps) => (
  <CanAccess action={action} fallback={fallback} resource={resource}>
    {children}
  </CanAccess>
);

export const AppRouter = ({
  diagnosticsState,
  resourcePageRoutes = appResourcePageRoutes,
}: AppRouterProps) => (
  <Suspense fallback={<FullPageLoader />}>
    <Routes>
      <Route
        index
        element={<Navigate to={routes.diagnostics} replace />}
      />
      {diagnosticsState ? (
        <Route
          path={routes.diagnostics}
          element={<DiagnosticsPage state={diagnosticsState} />}
        />
      ) : null}
      <Route
        element={
          // Nhánh guest chỉ render Outlet khi chưa đăng nhập; user đã có phiên
          // truy cập /login sẽ được đưa thẳng về dashboard.
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

      {/* Callback nằm ngoài guest guard vì tại thời điểm này OIDC session chưa
          được hoàn tất để Authenticated có thể xác nhận người dùng. */}
      <Route path={routes.callback} element={<LarkCallbackPage />} />
      <Route path={routes.forbidden} element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path={routes.selectTenant} element={<SelectTenantPage />} />

        <Route element={<TenantGuard />}>
          <Route element={<MainLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
            <Route
              path={routes.operations}
              element={<OperationsDashboardPage />}
            />
            {resourcePageRoutes.map(({ action, component, path, resource }) => (
              <Route
                element={
                  <ResourceAccessBoundary
                    action={action}
                    resource={resource}
                  >
                    {createElement(component)}
                  </ResourceAccessBoundary>
                }
                key={path}
                path={path}
              />
            ))}
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);
