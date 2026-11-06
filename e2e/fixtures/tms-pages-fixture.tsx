/* eslint-disable @typescript-eslint/no-explicit-any */
import "@vitejs/plugin-react/preamble";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { App as AntdApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";

import { initializeAppI18n } from "../../src/locales";
import { AppLayout } from "../../src/components/AppLayout";
import { OperationsDashboardPage } from "../../src/pages/tms-flow/OperationsDashboardPage";
import { DispatchPage } from "../../src/pages/tms-flow/DispatchPage";
import { LiveTrackingPage } from "../../src/pages/tms-flow/LiveTrackingPage";
import { TmsFlowRoot } from "../../src/pages/tms-flow/TmsFlowRoot";
import { OptimizationPage } from "../../src/pages/optimization/OptimizationPage";
import { canJwtRolesAccess } from "../../src/providers/permissions/roleMatrix";
import "../../src/styles/global.scss";
import "../../src/styles/app.scss";

const i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });

const fixtureAuthProvider = {
  check: async () => ({ authenticated: true }),
  getIdentity: async () => ({
    id: "e2e-office-user",
    openId: "e2e-office-user",
    name: "Nhân viên kiểm thử",
    email: "tms-fixture@example.invalid",
    tenantKey: "e2e-tenant",
    tenantName: "Tenant kiểm thử",
    tenantId: "e2e-tenant",
    roles: ["ADMIN"],
    permissions: [],
    tenants: [{ id: "e2e-tenant", tenantKey: "e2e-tenant", tenantName: "Tenant kiểm thử" }],
  }),
  getPermissions: async () => ["ADMIN"],
  login: async () => ({ success: true }),
  logout: async () => ({ success: true }),
  onError: async (error: unknown) => ({ error }),
};

const mockDataProvider = {
  getOne: async () => ({ data: {} }),
  getList: async () => ({ data: [], total: 0 }),
  getMany: async () => ({ data: [] }),
  create: async () => ({ data: {} }),
  update: async () => ({ data: {} }),
  deleteOne: async () => ({ data: {} }),
  getApiUrl: () => "/api",
  custom: async () => ({ data: {} }),
} as any;

const mockAccessControl = {
  can: async ({ resource, action }: { resource?: string; action?: string }) => ({
    can: canJwtRolesAccess(["ADMIN"], resource, action ?? "list")
      || ["loads", "notifications", "optimization", "ai-dispatch"].includes(resource ?? ""),
  }),
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ConfigProvider locale={viVN}>
        <AntdApp>
          <BrowserRouter>
            <Refine
              authProvider={fixtureAuthProvider as any}
              dataProvider={mockDataProvider}
              routerProvider={routerProvider}
              accessControlProvider={mockAccessControl}
              options={{
                disableTelemetry: true,
                reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } },
              }}
              resources={[
                { name: "loads", list: "/loads" },
                { name: "notifications", list: "/notifications" },
                { name: "ai-dispatch", list: "/ai-dispatch" },
                { name: "optimization", list: "/optimization" },
              ]}
            >
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/tms" element={<TmsFlowRoot />}>
                    <Route index element={<OperationsDashboardPage />} />
                    <Route path="dispatch" element={<DispatchPage />} />
                    <Route path="approvals" element={<DispatchPage approvalsOnly />} />
                    <Route path="live-tracking" element={<LiveTrackingPage />} />
                  </Route>
                  <Route path="/optimization" element={<OptimizationPage />} />
                </Route>
              </Routes>
            </Refine>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
