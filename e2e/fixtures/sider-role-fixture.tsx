/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import { App as AntdApp, ConfigProvider } from "antd";
import axios from "axios";

import { initializeAppI18n } from "../../src/locales";
import "@/styles/global.scss";
import { AppLayout } from "../../src/components/AppLayout";
import { LoadShow } from "../../src/pages/loads/show";
import { LoadList } from "../../src/pages/loads/list";
import { TripList } from "../../src/pages/trips/list";
import { OperationsDashboardPage } from "../../src/pages/dashboard/OperationsDashboardPage";
import type { Load } from "../../src/types/load.types";
import { canJwtRolesAccess } from "../../src/providers/permissions/roleMatrix";
import { JWT_ROLES, type JwtRole } from "../../src/types/roles.types";
import { NAV_ZONES } from "../../src/components/AppSider";

declare global {
  interface Window {
    __roleMenuExpectation?: Array<{ key: string; visible: boolean }>;
  }
}

// Setup I18n
const i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });

// Sample load matching logistics system schema
const sampleLoad: Load = {
  id: "101",
  number: 48291,
  name: "Oakland → Sacramento Express",
  type: "Reefer 53'",
  status: "in_transit",
  distance: 88,
  isInProximity: true,
  customerId: "cust-acme",
  customerName: "Acme Retail",
  assignedTruckId: "trk-5531",
  assignedTruckNumber: "TR-5531",
  assignedDispatcherName: "Marcus Johnson",
  source: "manual",
  isHazmat: false,
  deliveryCostAmount: 1842,
  deliveryCostCurrency: "USD",
  version: 2,
  requestedPickupDate: "2026-10-16T09:48:00Z",
  requestedDeliveryDate: "2026-10-16T15:18:00Z",
  dispatchedAt: "2026-10-16T08:30:00Z",
  pickedUpAt: "2026-10-16T09:48:00Z",
  originAddressLine1: "Oakland DC Dock 4",
  originAddressCity: "Oakland",
  originAddressState: "CA",
  originAddressZipCode: "94601",
  originAddressCountry: "USA",
  destinationAddressLine1: "Sacramento Terminal",
  destinationAddressCity: "Sacramento",
  destinationAddressState: "CA",
  destinationAddressZipCode: "95814",
  destinationAddressCountry: "USA",
  notes: "Nhiệt độ thùng lạnh duy trì 34°F. Ưu tiên dỡ hàng tại Dock 4.",
};

const sampleLoadsList = [
  sampleLoad,
  {
    ...sampleLoad,
    id: "102",
    number: 48292,
    name: "Los Angeles → Phoenix Reefer",
    status: "dispatched",
    customerName: "Global Foods",
    assignedTruckNumber: "TR-4412",
  },
  {
    ...sampleLoad,
    id: "103",
    number: 48293,
    name: "Seattle → Portland Dry Van",
    status: "delivered",
    customerName: "Pacific Logistics",
    assignedTruckNumber: "TR-9901",
  },
];

const sampleTripsList = [
  {
    id: "trip-201",
    number: 1001,
    name: "Chuyến bay CA-990",
    status: "in_progress",
    totalDistance: 340,
    truckNumber: "TR-5531",
    driverName: "Marcus Johnson",
  },
  {
    id: "trip-202",
    number: 1002,
    name: "Tuyến Bắc California",
    status: "scheduled",
    totalDistance: 195,
    truckNumber: "TR-4412",
    driverName: "David Chen",
  },
];

// Mock axios calls for AI, dashboard, timeline
axios.interceptors.request.use(async (config) => {
  const url = config.url || "";

  if (url.includes("/api/ai/features")) {
    config.adapter = async () => ({
      data: { enabled: true, dryRun: false },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  } else if (url.includes("/api/dashboard/operations")) {
    config.adapter = async () => ({
      data: {
        activeTrips: 18,
        pendingLoads: 42,
        availableDrivers: 26,
        onTimeRate: 98.4,
        delayedTrips: 2,
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  } else if (url.includes("/api/ai/loads/") && url.includes("/gaps")) {
    config.adapter = async () => ({
      data: {
        loadId: "101",
        aiState: "idle",
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        gaps: [],
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  } else if (url.includes("/api/ai/loads/") && url.includes("/dispatch")) {
    config.adapter = async () => ({
      data: {
        loadId: "101",
        dispatchState: "ready",
        rankingSource: "llm",
        confidenceScore: 0.92,
        suggestions: [],
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  } else if (url.includes("/timeline")) {
    config.adapter = async () => ({
      data: {
        loadId: "101",
        events: [],
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  }

  return config;
});

// Custom Refine data provider
const mockDataProvider = {
  getOne: async ({ resource }: { resource: string }) => {
    if (resource === "loads") {
      return { data: sampleLoad as any };
    }
    return { data: {} as any };
  },
  getList: async ({ resource }: { resource: string }) => {
    if (resource === "loads") {
      return { data: sampleLoadsList as any[], total: sampleLoadsList.length };
    }
    if (resource === "trips") {
      return { data: sampleTripsList as any[], total: sampleTripsList.length };
    }
    if (resource === "documents") {
      return { data: [], total: 0 };
    }
    return { data: [], total: 0 };
  },
  getMany: async () => ({ data: [] }),
  create: async () => ({ data: {} as any }),
  update: async () => ({ data: {} as any }),
  deleteOne: async () => ({ data: {} as any }),
  getApiUrl: () => "/api",
  custom: async () => ({ data: {} }),
} as any;

const searchParams = new URLSearchParams(window.location.search);
const roleParam = searchParams.get("role") ?? "ADMIN";
const fixtureRole: JwtRole = JWT_ROLES.includes(roleParam as JwtRole)
  ? (roleParam as JwtRole)
  : "ADMIN";
const mockAccessControl = {
  can: async ({ resource, action }: { resource?: string; action?: string }) => ({
    can: canJwtRolesAccess([fixtureRole], resource, action ?? "list"),
  }),
};

window.__roleMenuExpectation = NAV_ZONES.map((zone) => {
  const items = "items" in zone ? zone.items : [zone];
  return {
    key: zone.key,
    visible: items.some((item) => item.permission
      ? canJwtRolesAccess([fixtureRole], item.permission.resource, item.permission.action)
      : item.resource
        ? canJwtRolesAccess([fixtureRole], item.resource, "list")
        : true),
  };
});

// This fixture demonstrates role-matrix visibility only; it is never live auth or tenant UAT.
const initialRoute = searchParams.get("route") || "/operations";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Refine
              dataProvider={mockDataProvider}
              routerProvider={routerProvider}
              accessControlProvider={mockAccessControl}
              options={{
                disableTelemetry: true,
                reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } },
              }}
              resources={[
                {
                  name: "loads",
                  list: "/loads",
                  show: "/loads/show/:id",
                },
                {
                  name: "trips",
                  list: "/trips",
                },
              ]}
            >
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/operations" element={<OperationsDashboardPage />} />
                  <Route path="/dashboard" element={<OperationsDashboardPage />} />
                  <Route path="/loads" element={<LoadList />} />
                  <Route path="/loads/show/:id" element={<LoadShow />} />
                  <Route path="/trips" element={<TripList />} />
                </Route>
              </Routes>
            </Refine>
          </MemoryRouter>
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  </React.StrictMode>
);
