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
import { LoadShow } from "../../src/pages/loads/show";
import type { Load } from "../../src/types/load.types";

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

// Mock axios calls for AI, timeline, documents
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
  } else if (url.includes("/api/ai/loads/") && url.includes("/gaps")) {
    config.adapter = async () => ({
      data: {
        loadId: "101",
        aiState: "idle",
        capabilities: { canRerun: true, canApprove: true, canReject: true, canViewRuns: true },
        gaps: [
          {
            id: "gap-1",
            loadId: "101",
            severity: "warning",
            status: "open",
            fieldName: "sealNumber",
            fieldKey: "sealNumber",
            fieldLabel: "Số niêm phong chì (Seal Number)",
            questionNatural: "Chưa cập nhật số seal niêm phong trước khi xuất bến.",
            askCount: 1,
            maxAsks: 3,
            lastAskedAt: new Date().toISOString(),
          },
        ],
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
        suggestions: [
          {
            id: "sug-1",
            driverId: "drv-1",
            driverName: "Marcus Johnson",
            truckId: "trk-5531",
            truckNumber: "TR-5531",
            score: 0.92,
            recommendationTitle: "Đổi lộ trình qua cao tốc I-680 tránh ùn tắc Vallejo",
            whatHappened: "Chuyến hàng có nguy cơ chậm 47 phút do tắc đường trên cao tốc I-80 hướng Đông gần Vallejo.",
            why: "Tốc độ trung bình giảm 24% vì sự cố va chạm giao thông. Tiếp tục lộ trình cũ sẽ trễ khung giờ giao.",
            recommendation: "Chuyển hướng sang I-680 qua ngả Walnut Creek và thông báo khách hàng.",
            metrics: {
              timeSavedMinutes: 31,
              extraDistanceMiles: 4.2,
              deliveryWindowKept: true,
            },
            status: "executed",
            approvedBy: "Sarah Bennett",
            approvedAt: "2026-10-16T11:58:00Z",
          },
        ],
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
        events: [
          {
            id: "1",
            eventType: "PICKUP",
            status: "COMPLETED",
            title: "Shipment picked up",
            timestamp: "2026-10-16T09:14:00Z",
            description: "Marcus Johnson · Oakland DC Dock 4",
          },
          {
            id: "2",
            eventType: "DELAY",
            status: "WARNING",
            title: "Traffic delay detected · +18 min",
            timestamp: "2026-10-16T11:32:00Z",
            description: "Speed down 24% between Richmond and Vallejo",
          },
          {
            id: "3",
            eventType: "AI_RECOMMENDATION",
            status: "AI",
            title: "AI generated reroute recommendation",
            timestamp: "2026-10-16T11:34:00Z",
            description: "Route Agent · 92% confidence",
          },
          {
            id: "4",
            eventType: "APPROVAL",
            status: "APPROVED",
            title: "Reroute approved by Sarah Bennett",
            timestamp: "2026-10-16T11:58:00Z",
            description: "I-680 via Walnut Creek · ETA update sent to Acme",
          },
          {
            id: "5",
            eventType: "DELIVERY",
            status: "PENDING",
            title: "Delivery at Acme Retail, Sacramento",
            timestamp: "2026-10-16T15:18:00Z",
            description: "ETA now · inside the 15:00–15:30 window",
          },
        ],
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
    if (resource === "documents") {
      return {
        data: [
          {
            id: "doc-1",
            loadId: "101",
            fileName: "Bill of lading.pdf",
            type: "bill_of_lading",
            status: "signed",
            uploadedAt: "2026-10-16T09:14:00Z",
          },
          {
            id: "doc-2",
            loadId: "101",
            fileName: "Rate sheet.pdf",
            type: "rate_sheet",
            status: "approved",
            uploadedAt: "2026-10-16T08:30:00Z",
          },
        ] as any[],
        total: 2,
      };
    }
    return { data: [], total: 0 };
  },
  getMany: async () => ({ data: [] }),
  create: async () => ({ data: {} as any }),
  update: async () => ({ data: {} as any }),
  deleteOne: async () => ({ data: {} as any }),
  getApiUrl: () => "/api",
  custom: async ({ url }: { url: string }) => {
    if (url.includes("/timeline")) {
      return {
        data: {
          loadId: "101",
          events: [
            {
              id: "1",
              eventType: "PICKUP",
              status: "COMPLETED",
              title: "Shipment picked up",
              timestamp: "2026-10-16T09:14:00Z",
              description: "Marcus Johnson · Oakland DC Dock 4",
            },
            {
              id: "2",
              eventType: "DELAY",
              status: "WARNING",
              title: "Traffic delay detected · +18 min",
              timestamp: "2026-10-16T11:32:00Z",
              description: "Speed down 24% between Richmond and Vallejo",
            },
            {
              id: "3",
              eventType: "AI_RECOMMENDATION",
              status: "AI",
              title: "AI generated reroute recommendation",
              timestamp: "2026-10-16T11:34:00Z",
              description: "Route Agent · 92% confidence",
            },
            {
              id: "4",
              eventType: "APPROVAL",
              status: "APPROVED",
              title: "Reroute approved by Sarah Bennett",
              timestamp: "2026-10-16T11:58:00Z",
              description: "I-680 via Walnut Creek · ETA update sent to Acme",
            },
            {
              id: "5",
              eventType: "DELIVERY",
              status: "PENDING",
              title: "Delivery at Acme Retail, Sacramento",
              timestamp: "2026-10-16T15:18:00Z",
              description: "ETA now · inside the 15:00–15:30 window",
            },
          ],
        },
      };
    }
    return { data: {} };
  },
} as any;

const mockAccessControl = {
  can: async () => ({ can: true }),
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <MemoryRouter initialEntries={["/loads/show/101"]}>
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
                  show: "/loads/show/:id",
                },
              ]}
            >
              <Routes>
                <Route path="/loads/show/:id" element={<LoadShow />} />
              </Routes>
            </Refine>
          </MemoryRouter>
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  </React.StrictMode>
);
