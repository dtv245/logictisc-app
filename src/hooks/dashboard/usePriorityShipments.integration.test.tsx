import { Refine } from "@refinedev/core";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosHeaders } from "axios";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/providers/api/apiClient";
import { createLogisticsDataProvider } from "@/providers/dataProvider";
import { foundationApiResources } from "@/pages/resourceRegistry";
import { usePriorityShipments } from "@/hooks/dashboard/usePriorityShipments";

vi.mock("react-i18next", async (importOriginal) => ({
  ...await importOriginal<typeof import("react-i18next")>(),
  useTranslation: () => ({ i18n: { resolvedLanguage: "vi", exists: () => false }, t: (_key: string, options: { defaultValue: string }) => options.defaultValue }),
}));

describe("priority shipments through the real Refine data provider", () => {
  it("reaches the load endpoint with supported filters and default sorting", async () => {
    const requests = vi.fn();
    const client = createApiClient({
      runtimeConfig: { apiBaseUrl: "http://localhost:8080", healthPath: "/api/health", requestTimeoutMs: 5000 },
      tokenProvider: { getAccessToken: () => "fixture-token", refreshAccessToken: async () => null },
      adapter: async (config) => {
        requests(config);
        return {
          config, status: 200, statusText: "OK", headers: new AxiosHeaders(),
          data: { success: true, code: "OK", message: "OK", data: {
            items: [{ id: "load-integration", number: 42, name: "Shipment", status: "in_transit", originAddressCity: "Hà Nội", destinationAddressCity: "Hải Phòng" }],
            totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 20,
          }, errors: [], meta: { timestamp: "2026-10-16T00:00:00Z", path: "/api/loads", requestId: null } },
        };
      },
    });
    const dataProvider = createLogisticsDataProvider({ apiClient: client, resources: foundationApiResources });
    const wrapper = ({ children }: PropsWithChildren) => <Refine
      dataProvider={dataProvider} accessControlProvider={{ can: async () => ({ can: true }) }}
      options={{ disableTelemetry: true, reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false } } } } }}
    >{children}</Refine>;

    const { result } = renderHook(() => usePriorityShipments(), { wrapper });
    await waitFor(() => expect(result.current.shipments).toHaveLength(1));
    expect(result.current.error).toBeUndefined();
    expect(result.current.shipments[0].reference).toBe("#42");
    expect(requests).toHaveBeenCalledWith(expect.objectContaining({ url: "/api/loads", params: { page: 1, pageSize: 20, status: "in_transit" } }));
    result.current.retry();
    await waitFor(() => expect(requests).toHaveBeenCalledTimes(2));
  });
});
