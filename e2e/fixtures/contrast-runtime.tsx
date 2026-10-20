/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { App as AntdApp, ConfigProvider } from "antd";
import { initializeAppI18n } from "../../src/locales";
import { AppLayout } from "../../src/components/AppLayout";
import { OperationsDashboardPage } from "../../src/pages/dashboard/OperationsDashboardPage";
import { LoadList } from "../../src/pages/loads/list";
import { LoadShow } from "../../src/pages/loads/show";
import { AiDispatchPage } from "../../src/pages/ai-dispatch/AiDispatchPage";
import { OptimizationPage } from "../../src/pages/optimization/OptimizationPage";
import { DocumentList } from "../../src/pages/documents/list";
import { FleetReportPage } from "../../src/pages/fleet/FleetReportPage";
import type { Load } from "../../src/types/load.types";
import "@/styles/global.scss";

const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en", strictMissingKeys: true });
const load: Load = {
  id: "contrast-load-1", number: 4312, name: "Sacramento produce delivery", type: "dry_van", status: "dispatched",
  distance: 88, isInProximity: true, customerId: "customer-1", customerName: "North Market", assignedTruckId: "truck-1",
  assignedTruckNumber: "TR-4312", assignedDispatcherName: "Jordan Lee", source: "manual", isHazmat: false,
  deliveryCostAmount: 1240, deliveryCostCurrency: "USD", version: 1, originAddressLine1: "Oakland Warehouse",
  originAddressCity: "Oakland", originAddressState: "CA", originAddressZipCode: "94601", originAddressCountry: "USA",
  destinationAddressLine1: "Market Terminal", destinationAddressCity: "Sacramento", destinationAddressState: "CA",
  destinationAddressZipCode: "95814", destinationAddressCountry: "USA",
};

const dataProvider = {
  getOne: async ({ resource }: { resource: string }) => resource === "loads" ? { data: load as any } : { data: {} as any },
  getList: async ({ resource }: { resource: string }) => resource === "loads"
    ? { data: [load] as any[], total: 1 }
    : { data: [], total: 0 },
  getMany: async () => ({ data: [] }),
  create: async () => ({ data: {} as any }),
  update: async () => ({ data: {} as any }),
  deleteOne: async () => ({ data: {} as any }),
  getApiUrl: () => "/api",
  custom: async ({ url }: { url: string }) => {
    if (url.includes("notification")) return { data: [] };
    if (url.includes("fleet/policies")) return { data: [] };
    if (url.includes("trucks")) return { data: [] };
    if (url.includes("dashboard")) return { data: {} };
    return { data: {} };
  },
} as any;

const identity = {
  id: "fixture-user", name: "Jordan Lee", role: "ADMIN", tenantId: "fixture-tenant", tenantKey: "fixture-tenant",
  tenantName: "Fixture tenant", tenants: [{ id: "fixture-tenant", tenantKey: "fixture-tenant", tenantName: "Fixture tenant" }],
};
const authProvider = {
  login: async () => ({ success: true }), logout: async () => ({ success: true }),
  check: async () => ({ authenticated: true }), getIdentity: async () => identity, onError: async () => ({}),
};
const accessControlProvider = { can: async () => ({ can: true }) };
const route = new URLSearchParams(window.location.search).get("route") ?? "/operations";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <MemoryRouter initialEntries={[route]}>
            <Refine
              authProvider={authProvider}
              dataProvider={dataProvider}
              accessControlProvider={accessControlProvider}
              routerProvider={routerProvider}
              options={{ disableTelemetry: true, reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}
              resources={[
                { name: "loads", list: "/loads", show: "/loads/show/:id" },
                { name: "documents", list: "/documents" },
              ]}
            >
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/operations" element={<OperationsDashboardPage />} />
                  <Route path="/loads" element={<LoadList />} />
                  <Route path="/loads/show/:id" element={<LoadShow />} />
                  <Route path="/ai-dispatch" element={<AiDispatchPage />} />
                  <Route path="/optimization" element={<OptimizationPage />} />
                  <Route path="/documents" element={<DocumentList />} />
                  <Route path="/reports/fleet" element={<FleetReportPage policies={[]} trucks={[]} />} />
                </Route>
              </Routes>
            </Refine>
          </MemoryRouter>
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
