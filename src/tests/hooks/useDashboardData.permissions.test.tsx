/**
 * FE-07: operational report queries must follow the report permission, not the
 * `loads:list` grant that happens to gate the TMS route.
 *
 * Backend policy (SecurityConfig at `d4a986f`): GET `/api/reports/operations/**`
 * is allowed for ADMIN, ACCOUNTANT, DISPATCHER, PAYROLL and PAYROLL_MANAGER.
 * The frontend mirrors that as `reports:OPERATIONS_VIEW`.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CustomCall = {
  url: string;
  queryOptions: { enabled?: boolean };
};

const harness = vi.hoisted(() => ({
  can: true,
  customCalls: [] as CustomCall[],
  refetches: [] as Array<{ url: string; fn: ReturnType<typeof vi.fn> }>,
}));

vi.mock("@refinedev/core", () => ({
  useCan: () => ({ data: { can: harness.can }, isLoading: false }),
  useCustom: (args: CustomCall) => {
    harness.customCalls.push(args);
    const refetch = vi.fn();
    harness.refetches.push({ url: args.url, fn: refetch });
    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch,
    };
  },
  useDataProvider: () => () => ({ custom: vi.fn() }),
  useList: () => ({
    data: { total: 0 },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueries: (options: { queries: unknown[] }) =>
    options.queries.map(() => ({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })),
}));

import { useDashboardData } from "@/hooks/useDashboardData";
import { DASHBOARD_ENDPOINTS } from "@/features/dashboard/api";
import type { DashboardFilters } from "@/types/dashboard/dashboard.types";

const filters: DashboardFilters = {
  preset: "custom",
  from: "2026-10-01",
  to: "2026-10-31",
  currency: "VND",
  comparePrevious: true,
  businessZoneId: "",
};

const OPERATION_URLS: readonly string[] = [
  DASHBOARD_ENDPOINTS.onTimeDelivery,
  DASHBOARD_ENDPOINTS.delays,
  DASHBOARD_ENDPOINTS.transitTime,
  DASHBOARD_ENDPOINTS.exceptions,
];

const callsFor = (url: string) =>
  harness.customCalls.filter((call) => call.url === url);

describe("useDashboardData report permissions", () => {
  beforeEach(() => {
    harness.can = true;
    harness.customCalls = [];
    harness.refetches = [];
  });

  it("enables operational report queries when reports:OPERATIONS_VIEW is granted", () => {
    renderHook(() => useDashboardData(filters, { enableFinancials: false }));

    for (const url of OPERATION_URLS) {
      const calls = callsFor(url);
      expect(calls.length, url).toBeGreaterThan(0);
      expect(calls.every((call) => call.queryOptions.enabled === true), url).toBe(
        true,
      );
    }
  });

  it("issues no operational report request when the grant is missing", () => {
    harness.can = false;
    renderHook(() => useDashboardData(filters, { enableFinancials: false }));

    for (const url of OPERATION_URLS) {
      const calls = callsFor(url);
      expect(calls.length, url).toBeGreaterThan(0);
      expect(calls.every((call) => call.queryOptions.enabled === false), url).toBe(
        true,
      );
    }
  });

  it("does not refetch operational reports without the grant", () => {
    harness.can = false;
    const { result } = renderHook(() =>
      useDashboardData(filters, { enableFinancials: false }),
    );

    act(() => result.current.refetchAll());

    const operationRefetches = harness.refetches.filter((entry) =>
      OPERATION_URLS.includes(entry.url),
    );
    expect(operationRefetches.length).toBeGreaterThan(0);
    expect(
      operationRefetches.every((entry) => entry.fn.mock.calls.length === 0),
    ).toBe(true);
  });

  it("keeps financial report queries gated by enableFinancials, not by the operations grant", () => {
    renderHook(() => useDashboardData(filters, { enableFinancials: false }));

    for (const url of [
      DASHBOARD_ENDPOINTS.expenses,
      DASHBOARD_ENDPOINTS.operatingCpm,
      DASHBOARD_ENDPOINTS.fuel,
      DASHBOARD_ENDPOINTS.maintenance,
      DASHBOARD_ENDPOINTS.profitabilityByLane,
      DASHBOARD_ENDPOINTS.profitabilityByTruck,
    ]) {
      const calls = callsFor(url);
      expect(calls.length, url).toBeGreaterThan(0);
      expect(calls.every((call) => call.queryOptions.enabled === false), url).toBe(
        true,
      );
    }
  });

  it("reports unavailable, never zero, when a report query is disabled", () => {
    harness.can = false;
    const { result } = renderHook(() =>
      useDashboardData(filters, { enableFinancials: false }),
    );

    expect(result.current.otd.data).toBeUndefined();
    expect(result.current.otd.error).toBeNull();
    expect(result.current.exceptions.data).toBeUndefined();
    expect(result.current.exceptions.error).toBeNull();
  });
});
