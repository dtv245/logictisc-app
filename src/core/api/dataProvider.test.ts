/**
 * Verifies Refine v4 adaptation, explicit resource contracts, and stale-list
 * cancellation through the shared API client.
 */

import {
  AxiosHeaders,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it } from "vitest";

import { createApiClient } from "./client";
import { createLogisticsDataProvider } from "./dataProvider";

const runtimeConfig = {
  apiBaseUrl: "http://localhost:8080",
  healthPath: "/api/health",
  requestTimeoutMs: 5_000,
};

const resources = {
  widgets: {
    collectionPath: "/api/widgets",
    allowedFilterFields: ["search", "status"],
    allowedSortFields: ["name", "createdAt"],
  },
} as const;

const createEnvelope = (data: unknown) => ({
  success: true,
  code: "SUCCESS",
  message: "SUCCESS",
  data,
  errors: [],
  meta: {
    timestamp: "2026-07-27T03:00:00Z",
    path: "/api/widgets",
    requestId: "34bcd643-30ec-4a12-a89b-46c960717efa",
  },
});

const createResponse = (
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse<unknown> => ({
  config,
  data,
  headers: new AxiosHeaders(),
  status: 200,
  statusText: "200",
});

const createAdapter = (
  handler: (
    config: InternalAxiosRequestConfig,
  ) => AxiosResponse<unknown> | Promise<AxiosResponse<unknown>>,
): AxiosAdapter => async (config) => handler(config);

const createProvider = (adapter: AxiosAdapter) => {
  const apiClient = createApiClient({
    runtimeConfig,
    tokenProvider: {
      getAccessToken: () => "access-token",
      refreshAccessToken: async () => "refreshed-token",
    },
    adapter,
  });

  return createLogisticsDataProvider({
    apiClient,
    resources,
  });
};

describe("createLogisticsDataProvider", () => {
  it("serializes a one-based list and adapts PagedResponse totals", async () => {
    let observedParams: unknown;
    const provider = createProvider(
      createAdapter((config) => {
        observedParams = config.params;
        return createResponse(
          config,
          createEnvelope({
            items: [{ id: "widget-1", name: "One" }],
            totalItems: 24,
            totalPages: 2,
            currentPage: 2,
            pageSize: 20,
          }),
        );
      }),
    );

    const result = await provider.getList<{
      id: string;
      name: string;
    }>({
      resource: "widgets",
      pagination: {
        current: 2,
        pageSize: 500,
      },
      filters: [
        {
          field: "search",
          operator: "contains",
          value: "One",
        },
      ],
      sorters: [{ field: "name", order: "asc" }],
    });

    expect(observedParams).toEqual({
      page: 2,
      pageSize: 100,
      search: "One",
      orderBy: "name",
      descending: false,
    });
    expect(result).toEqual({
      data: [{ id: "widget-1", name: "One" }],
      total: 24,
    });
  });

  it("uses the contract PUT method and safely encodes item IDs", async () => {
    let observedMethod: string | undefined;
    let observedUrl: string | undefined;
    const provider = createProvider(
      createAdapter((config) => {
        observedMethod = config.method;
        observedUrl = config.url;
        return createResponse(
          config,
          createEnvelope({ id: "widget/1", name: "Updated" }),
        );
      }),
    );

    const result = await provider.update<{
      id: string;
      name: string;
    }>({
      resource: "widgets",
      id: "widget/1",
      variables: { name: "Updated" },
    });

    expect(observedMethod).toBe("put");
    expect(observedUrl).toBe("/api/widgets/widget%2F1");
    expect(result.data).toEqual({
      id: "widget/1",
      name: "Updated",
    });
  });

  it("rejects resources that do not have an injected API contract", async () => {
    const provider = createProvider(
      createAdapter((config) =>
        createResponse(config, createEnvelope({})),
      ),
    );

    await expect(
      provider.getList({
        resource: "invented-resource",
      }),
    ).rejects.toThrow(
      "RESOURCE_NOT_CONFIGURED:invented-resource",
    );
  });

  it("aborts an older list request when a newer list starts", async () => {
    let callCount = 0;
    let markFirstStarted: (() => void) | null = null;
    const firstStarted = new Promise<void>((resolve) => {
      markFirstStarted = resolve;
    });
    const provider = createProvider(
      createAdapter((config) => {
        callCount += 1;

        if (callCount === 1) {
          markFirstStarted?.();

          return new Promise<AxiosResponse<unknown>>(
            (_resolve, reject) => {
              const rejectCancellation = (): void => {
                reject(
                  new CanceledError(
                    "STALE_LIST_REQUEST",
                    config,
                  ),
                );
              };

              if (config.signal?.aborted) {
                rejectCancellation();
              } else {
                config.signal?.addEventListener?.(
                  "abort",
                  rejectCancellation,
                  { once: true },
                );
              }
            },
          );
        }

        return createResponse(
          config,
          createEnvelope({
            items: [{ id: "widget-2" }],
            totalItems: 1,
            totalPages: 1,
            currentPage: 1,
            pageSize: 20,
          }),
        );
      }),
    );

    const first = provider.getList({
      resource: "widgets",
      filters: [
        {
          field: "search",
          operator: "contains",
          value: "old",
        },
      ],
    });

    await firstStarted;

    const second = provider.getList({
      resource: "widgets",
      filters: [
        {
          field: "search",
          operator: "contains",
          value: "new",
        },
      ],
    });

    await expect(first).rejects.toMatchObject({
      code: "ERR_CANCELED",
    });
    await expect(second).resolves.toEqual({
      data: [{ id: "widget-2" }],
      total: 1,
    });
  });
});
