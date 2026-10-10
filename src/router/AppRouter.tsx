import { MESSAGING_RUNTIME_VERIFIED } from "@/features/messaging/messaging.api";
import { getResourceCapabilities } from "@/components/resources/resourceCapabilities";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/payroll.api";
import { PROFILE_CONTRACT_CONFIRMED } from "@/features/profile/profile.contract";
import { EXECUTIVE_CONTRACT_CONFIRMED } from "@/features/executive/executive.contract";
import type { PayslipDownloader } from "@/features/payslips/payslip.api";
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
const ProfilePage = lazy(() =>
  import("@pages/profile/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const ProfitabilityPage = lazy(() =>
  import("@pages/profitability/ProfitabilityPage").then((module) => ({ default: module.ProfitabilityPage })),
);
const MyPayslipsPage = lazy(() => import("@pages/payslips/MyPayslipsPage").then((module) => ({ default: module.MyPayslipsPage })));
const PayslipShowPage = lazy(() => import("@pages/payslips/PayslipShow").then((module) => ({ default: module.PayslipShow })));
const PayrollEntryPage = lazy(() => import("@pages/payroll/PayrollEntryPage").then((module) => ({ default: module.PayrollEntryPage })));
const PayrollReconciliationPage = lazy(() => import("@pages/payroll/PayrollReconciliationPage").then((module) => ({ default: module.PayrollReconciliationPage })));
const PayrollRunShowPage = lazy(() => import("@pages/payroll/PayrollRunShow").then((module) => ({ default: module.PayrollRunShow })));
const OptimizationPage = lazy(() => import("@pages/optimization/OptimizationPage").then((module) => ({ default: module.OptimizationPage })));
const OptimizationRunShowPage = lazy(() => import("@pages/optimization/OptimizationRunShow").then((module) => ({ default: module.OptimizationRunShow })));
const FleetReportPage = lazy(() => import("@pages/fleet/FleetReportPage").then((module) => ({ default: module.FleetReportPage })));
const AiDispatchPage = lazy(() =>
  import("@pages/ai-dispatch/AiDispatchPage").then((module) => ({
    default: module.AiDispatchPage,
  })),
);
const SettlementListPage = lazy(() =>
  import("@pages/settlements/SettlementList").then((module) => ({
    default: module.SettlementList,
  })),
);
const SettlementShowPage = lazy(() =>
  import("@pages/settlements/SettlementShow").then((module) => ({ default: module.SettlementShow })),
);
const DriverPayPolicyListPage = lazy(() =>
  import("@pages/settlements/DriverPayPolicyList").then((module) => ({
    default: module.DriverPayPolicyList,
  })),
);
const DriverPayPolicyShowPage = lazy(() =>
  import("@pages/settlements/DriverPayPolicyShow").then((module) => ({
    default: module.DriverPayPolicyShow,
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
  download?: PayslipDownloader;
  diagnosticsState?: ReadyBootstrapState;
  resourcePageRoutes?: readonly ResourcePageRoute[];
}

interface ResourceAccessBoundaryProps {
  action: string;
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
  download,
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
          // truy cập /login sẽ được đưa về màn hình có runtime contract đầy đủ.
          <Authenticated
            key="guest"
            fallback={<Outlet />}
            loading={<FullPageLoader />}
          >
            <Navigate to={EXECUTIVE_CONTRACT_CONFIRMED ? routes.dashboard : routes.operations} replace />
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
            {/* Existing auth return targets may still use /dashboard. Redirect
                without mounting its queries while BE-031 remains unresolved. */}
            <Route path={routes.dashboard} element={EXECUTIVE_CONTRACT_CONFIRMED ? <DashboardPage /> : <Navigate to={routes.operations} replace />} />
            <Route
              path={routes.operations}
              element={<OperationsDashboardPage />}
            />
            {PROFILE_CONTRACT_CONFIRMED && <Route path={routes.profile} element={<ProfilePage />} />}
            <Route path={routes.optimization} element={<ResourceAccessBoundary action="OPTIMIZATION_VIEW" resource="optimization"><OptimizationPage /></ResourceAccessBoundary>} />
            <Route path={routes.optimizationRun} element={<ResourceAccessBoundary action="OPTIMIZATION_VIEW" resource="optimization"><OptimizationRunShowPage /></ResourceAccessBoundary>} />
            <Route path={routes.fleetReport} element={<ResourceAccessBoundary action="FLEET_REPORT_VIEW" resource="fleet-reports"><FleetReportPage /></ResourceAccessBoundary>} />
            <Route path={routes.aiDispatch} element={<ResourceAccessBoundary action="AI_DISPATCH_VIEW" resource="ai-dispatch"><AiDispatchPage /></ResourceAccessBoundary>} />
            <Route path={routes.aiDispatchShow} element={<ResourceAccessBoundary action="AI_DISPATCH_VIEW" resource="ai-dispatch"><AiDispatchPage /></ResourceAccessBoundary>} />
            <Route path={routes.resources.aiDispatch.show} element={<ResourceAccessBoundary action="AI_DISPATCH_VIEW" resource="ai-dispatch"><AiDispatchPage /></ResourceAccessBoundary>} />
            <Route path={routes.profitability} element={
              <ResourceAccessBoundary resource="profitability" action="PROFITABILITY_VIEW">
                <ProfitabilityPage />
              </ResourceAccessBoundary>
            } />
            <Route
              path={routes.resources.settlements.list}
              element={
                <ResourceAccessBoundary action="SETTLEMENT_VIEW" resource="settlements">
                  <SettlementListPage />
                </ResourceAccessBoundary>
              }
            />
            <Route
              path={routes.resources.settlements.show}
              element={<ResourceAccessBoundary resource="settlements" action="SETTLEMENT_VIEW"><SettlementShowPage /></ResourceAccessBoundary>}
            />
            <Route
              path={routes.resources.settlements.policies}
              element={
                <ResourceAccessBoundary action="POLICY_VIEW" resource="driver-pay-policies">
                  <DriverPayPolicyListPage />
                </ResourceAccessBoundary>
              }
            />
            <Route
              path={routes.resources.settlements.policyShow}
              element={
                <ResourceAccessBoundary action="POLICY_VIEW" resource="driver-pay-policies">
                  <DriverPayPolicyShowPage />
                </ResourceAccessBoundary>
              }
            />
            <Route path={routes.myPayslips} element={<ResourceAccessBoundary action="PAYSLIP_VIEW" resource="payslips"><MyPayslipsPage /></ResourceAccessBoundary>} />
            <Route path={routes.payslipShow} element={<ResourceAccessBoundary action="PAYSLIP_VIEW" resource="payslips"><PayslipShowPage download={download} /></ResourceAccessBoundary>} />
            <Route path={routes.payroll} element={<ResourceAccessBoundary action="PAYROLL_VIEW" resource="payroll"><PayrollEntryPage /></ResourceAccessBoundary>} />
            {PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED && <Route path={routes.payrollReconciliation} element={<ResourceAccessBoundary action="PAYROLL_VIEW" resource="payroll"><PayrollReconciliationPage /></ResourceAccessBoundary>} />}
            <Route path={routes.payrollShow} element={<ResourceAccessBoundary action="PAYROLL_VIEW" resource="payroll"><PayrollRunShowPage /></ResourceAccessBoundary>} />
            {resourcePageRoutes.filter(({ resource, action }) => resource !== "terminals" && (resource !== "conversations" || MESSAGING_RUNTIME_VERIFIED) && (action !== "create" || getResourceCapabilities(resource).create) && (action !== "edit" || getResourceCapabilities(resource).edit)).map(({ action, component, path, resource }) => (
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
