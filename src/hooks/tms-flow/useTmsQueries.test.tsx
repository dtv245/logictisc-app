import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useInfiniteQuery: vi.fn<(options: Record<string, unknown>) => unknown>(() => ({})),
  useQuery: vi.fn<(options: Record<string, unknown>) => unknown>(() => ({})),
  queryCache: new Map<string, unknown>(),
  fetchAllLoads: vi.fn(async () => ({ items: [], truncated: false, totalItems: 0 })),
  fetchRisk: vi.fn(),
  fetchUnassigned: vi.fn(),
  useCurrentTenant: vi.fn(() => ({ tenant: { tenantKey: "tenant-a" } })),
}));

const queryClientMock = {
  fetchQuery: vi.fn(async (options: { queryKey: readonly unknown[]; queryFn: () => Promise<unknown> }) => {
    const key = JSON.stringify(options.queryKey);
    if (mocks.queryCache.has(key)) return mocks.queryCache.get(key);
    const result = await options.queryFn();
    mocks.queryCache.set(key, result);
    return result;
  }),
  getQueryData: vi.fn((key: readonly unknown[]) => mocks.queryCache.get(JSON.stringify(key))),
  setQueryDefaults: vi.fn(),
  setQueryData: vi.fn((key: readonly unknown[], value: unknown) => {
    mocks.queryCache.set(JSON.stringify(key), value);
    return value;
  }),
};

vi.mock("@/api/tms-flow/tmsFlow.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tms-flow/tmsFlow.api")>();
  return {
    ...actual,
    fetchAllLoads: mocks.fetchAllLoads,
    fetchDispatchRiskLoadsPage: mocks.fetchRisk,
    fetchDispatchUnassignedLoadsPage: mocks.fetchUnassigned,
  };
});

vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: mocks.useInfiniteQuery,
  useQuery: mocks.useQuery,
  useQueryClient: () => queryClientMock,
}));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: mocks.useCurrentTenant }));

import {
  useInfiniteTmsLoads,
  useInfiniteTmsRiskLoads,
  useInfiniteTmsUnassignedLoads,
  useLoadAiStatuses,
  usePendingSuggestions,
  useTmsTrucks,
} from "./useTmsQueries";
import { TmsApiError } from "@/api/tms-flow/tmsFlow.api";

beforeEach(() => {
  mocks.queryCache.clear();
  mocks.fetchAllLoads.mockClear();
  mocks.fetchAllLoads.mockResolvedValue({ items: [], truncated: false, totalItems: 0 });
  mocks.fetchRisk.mockReset().mockRejectedValue(new TmsApiError("Not found", { status: 404 }));
  mocks.fetchUnassigned.mockReset().mockRejectedValue(new TmsApiError("Not found", { status: 404 }));
  mocks.useInfiniteQuery.mockClear();
  mocks.useQuery.mockClear();
  mocks.useCurrentTenant.mockReturnValue({ tenant: { tenantKey: "tenant-a" } });
  queryClientMock.fetchQuery.mockClear();
  queryClientMock.getQueryData.mockClear();
  queryClientMock.setQueryDefaults.mockClear();
  queryClientMock.setQueryData.mockClear();
});

describe("TMS workspace refresh options", () => {
  it("stops interval refetching in a hidden tab and refreshes on return", () => {
    renderHook(() => {
      useInfiniteTmsLoads();
      useInfiniteTmsRiskLoads();
      useInfiniteTmsUnassignedLoads();
      useTmsTrucks();
      usePendingSuggestions();
      useLoadAiStatuses(["load-1"]);
    });

    const queryOptions = [
      ...mocks.useInfiniteQuery.mock.calls.map(([options]) => options),
      ...mocks.useQuery.mock.calls.map(([options]) => options),
    ] as Array<Record<string, unknown>>;

    expect(queryOptions).toHaveLength(6);
    for (const options of queryOptions) {
      expect(options.refetchInterval).toBe(30_000);
      expect(options.refetchIntervalInBackground).toBe(false);
      expect(options.refetchOnWindowFocus).toBe("always");
    }
  });

  it.each([
    ["risk", useInfiniteTmsRiskLoads, "fetchRisk"],
    ["unassigned", useInfiniteTmsUnassignedLoads, "fetchUnassigned"],
  ] as const)("caches a missing %s endpoint per tenant after the first 404", async (_name, hook, fetchMockName) => {
    renderHook(() => hook());
    const options = mocks.useInfiniteQuery.mock.calls.at(-1)?.[0];
    expect(options).toBeDefined();
    const queryFn = options?.queryFn as (context: { pageParam: number }) => Promise<unknown>;

    await queryFn({ pageParam: 1 });
    await queryFn({ pageParam: 1 });

    const endpointFetch = mocks[fetchMockName];
    expect(endpointFetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetchAllLoads).toHaveBeenCalledTimes(1);
    expect(queryClientMock.setQueryDefaults).toHaveBeenCalledWith(
      expect.arrayContaining(["tenant-a", "dispatch-board-endpoint-unavailable", _name]),
      { cacheTime: Infinity, staleTime: Infinity },
    );
    expect(queryClientMock.setQueryData).toHaveBeenCalledWith(
      expect.arrayContaining(["tenant-a", "dispatch-board-endpoint-unavailable", _name]),
      true,
    );
  });

  it("does not reuse a missing-endpoint result after switching tenants", async () => {
    renderHook(() => useInfiniteTmsRiskLoads());
    const firstOptions = mocks.useInfiniteQuery.mock.calls.at(-1)?.[0];
    const firstQueryFn = firstOptions?.queryFn as (context: { pageParam: number }) => Promise<unknown>;
    await firstQueryFn({ pageParam: 1 });

    mocks.useCurrentTenant.mockReturnValue({ tenant: { tenantKey: "tenant-b" } });
    renderHook(() => useInfiniteTmsRiskLoads());
    const secondOptions = mocks.useInfiniteQuery.mock.calls.at(-1)?.[0];
    const secondQueryFn = secondOptions?.queryFn as (context: { pageParam: number }) => Promise<unknown>;
    await secondQueryFn({ pageParam: 1 });

    expect(mocks.fetchRisk).toHaveBeenCalledTimes(2);
  });
});
