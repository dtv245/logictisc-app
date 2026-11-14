import { getResourceCapabilities } from "@/components/resources/resourceCapabilities";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/api/payroll.api";
import type { PayslipDownloader } from "@/features/payslips/api/payslip.api";
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
  import("@/components/AppLayout").then((module) => ({
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
const ProfitabilityPage = lazy(() =>
  import("@pages/profitability/ProfitabilityPage").then((module) => ({ default: module.ProfitabilityPage })),
);
const ExecutiveOverviewPage = lazy(() =>
  import("@pages/executive/ExecutiveOverviewPage").then((module) => ({ default: module.ExecutiveOverviewPage })),
);
const MyPayslipsPage = lazy(() => import("@pages/payslips/MyPayslipsPage").then((module) => ({ default: module.MyPayslipsPage })));
const PayslipShowPage = lazy(() => import("@pages/payslips/PayslipShow").then((module) => ({ default: module.PayslipShow })));
const PayrollEntryPage = lazy(() => import("@pages/payroll/PayrollEntryPage").then((module) => ({ default: module.PayrollEntryPage })));
const PayrollReconciliationPage = lazy(() => import("@pages/payroll/PayrollReconciliationPage").then((module) => ({ default: module.PayrollReconciliationPage })));
const PayrollRunShowPage = lazy(() => import("@pages/payroll/PayrollRunShow").then((module) => ({ default: module.PayrollRunShow })));
const TmsFlowRoot = lazy(() =>
  import("@pages/tms-flow/TmsFlowRoot").then((module) => ({
    default: module.TmsFlowRoot,
  })),
);
const TmsOperationsDashboardPage = lazy(() =>
  import("@pages/tms-flow/OperationsDashboardPage").then((module) => ({
    default: module.OperationsDashboardPage,
  })),
);
const TmsDispatchPage = lazy(() =>
  import("@pages/tms-flow/DispatchPage").then((module) => ({
    default: module.DispatchPage,
  })),
);
const TmsShipmentDetailPage = lazy(() =>
  import("@pages/tms-flow/ShipmentDetailPage").then((module) => ({
    default: module.ShipmentDetailPage,
  })),
);
const TmsLiveTrackingPage = lazy(() =>
  import("@pages/tms-flow/LiveTrackingPage").then((module) => ({
    default: module.LiveTrackingPage,
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
const SettingsPage = lazy(() => import("@pages/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));
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
        element={<Navigate to={routes.login} replace />}
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
            <Navigate to={routes.tmsFlow.root} replace />
          </Authenticated>
        }
      >
        <Route path={routes.login} element={<LoginPage />} />
      </Route>

      {/* Callback nằm ngoài guest guard vì tại thời điểm này OIDC session chưa
          được hoàn tất để Authenticated có thể xác nhận người dùng. */}
      <Route path={routes.callback} element={<LarkCallbackPage />} />
      <Route path={routes.forbidden} element={<ForbiddenPage />} />
      <Route path={routes.notFound} element={<NotFoundPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path={routes.selectTenant} element={<SelectTenantPage />} />

        <Route element={<TenantGuard />}>
          <Route element={<MainLayout />}>
            <Route path={routes.settings} element={<SettingsPage />} />
            {/* TMS là màn vận hành duy nhất; /dashboard và /operations cũ đã bỏ. */}
            <Route
              path={routes.tmsFlow.root}
              element={
                <ResourceAccessBoundary action="list" resource="loads">
                  <TmsFlowRoot />
                </ResourceAccessBoundary>
              }
            >
              <Route index element={<TmsOperationsDashboardPage />} />
              <Route path="dispatch" element={<TmsDispatchPage />} />
              <Route
                path="approvals"
                element={
                  <ResourceAccessBoundary
                    action="AI_DISPATCH_VIEW"
                    resource="ai-dispatch"
                  >
                    <TmsDispatchPage approvalsOnly />
                  </ResourceAccessBoundary>
                }
              />
              <Route path="live-tracking" element={<TmsLiveTrackingPage />} />
              <Route path="shipments/:shipmentId" element={<TmsShipmentDetailPage />} />
            </Route>
            <Route
              path={routes.executiveReport}
              element={
                <ResourceAccessBoundary action="EXECUTIVE_VIEW" resource="reports">
                  <ExecutiveOverviewPage />
                </ResourceAccessBoundary>
              }
            />
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
            <Route
              path={routes.resources.loads.list}
              element={
                <ResourceAccessBoundary action="list" resource="loads">
                  <Navigate to={routes.tmsFlow.dispatch} replace />
                </ResourceAccessBoundary>
              }
            />
            {resourcePageRoutes.filter(({ resource, action }) => resource !== "conversations" && !(resource === "loads" && action === "list") && (action !== "create" || getResourceCapabilities(resource).create) && (action !== "edit" || getResourceCapabilities(resource).edit)).map(({ action, component, path, resource }) => (
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
