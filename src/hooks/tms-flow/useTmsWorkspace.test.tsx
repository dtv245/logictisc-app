import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TmsLoadsPageSnapshot } from "./useTmsQueries";

const mocks = vi.hoisted(() => ({
  useInfiniteTmsLoads: vi.fn(),
  useInfiniteTmsRiskLoads: vi.fn(),
  useInfiniteTmsUnassignedLoads: vi.fn(),
  useLoadAiStatuses: vi.fn(),
  usePendingSuggestions: vi.fn(),
  useTmsTrucks: vi.fn(),
}));

vi.mock("@/hooks/tms-flow/useTmsQueries", () => mocks);

import { useTmsWorkspace } from "./useTmsWorkspace";

const snapshot = (id: string, countIsLowerBound = false): TmsLoadsPageSnapshot => ({
  page: {
    items: [{ id, number: 1, name: "Lô", customerId: "cust-1", status: "OPEN" } as never],
    totalItems: 4,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20,
  },
  shipments: [{
    id,
    number: 1,
    name: "Lô",
    customerName: "Khách hàng",
    rawStatus: "OPEN",
    status: "open",
    risk: "none",
    originCity: "Hà Nội",
    destinationCity: "Đà Nẵng",
    originAddress: "Hà Nội",
    destinationAddress: "Đà Nẵng",
    distance: 10,
    isHazmat: false,
    raw: { id } as never,
  }],
  generatedAt: 1_700_000_000_000,
  ...(countIsLowerBound ? { countIsLowerBound: true } : {}),
});

const query = (pages?: TmsLoadsPageSnapshot[]) => ({ data: pages ? { pages } : undefined });

describe("useTmsWorkspace count confidence", () => {
  it("marks fallback-derived counts as lower bounds when source loads were capped", () => {
    mocks.useInfiniteTmsLoads.mockReturnValue({ ...query([snapshot("load-main")]), error: null, isLoading: false });
    mocks.useInfiniteTmsRiskLoads.mockReturnValue({ ...query([snapshot("load-risk", true)]), error: null });
    mocks.useInfiniteTmsUnassignedLoads.mockReturnValue({ ...query([snapshot("load-open", true)]), error: null });
    mocks.useLoadAiStatuses.mockReturnValue({ data: [], error: null });
    mocks.usePendingSuggestions.mockReturnValue({ data: [], error: null });
    mocks.useTmsTrucks.mockReturnValue({ data: { items: [] }, error: null });

    const { result } = renderHook(() => useTmsWorkspace());

    expect(result.current.riskCollection).toMatchObject({ totalItems: 4, truncated: true });
    expect(result.current.unassignedCollection).toMatchObject({ totalItems: 4, truncated: true });
  });

  it("keeps cached rows and their update time after a failed background refresh", () => {
    const existing = snapshot("stale-load");
    mocks.useInfiniteTmsLoads.mockReturnValue({
      ...query([existing]),
      error: new Error("Network unavailable"),
      isLoading: false,
      isFetching: false,
      isRefetchError: true,
      dataUpdatedAt: 1234,
    });
    mocks.useInfiniteTmsRiskLoads.mockReturnValue({ data: undefined, error: null, dataUpdatedAt: 0 });
    mocks.useInfiniteTmsUnassignedLoads.mockReturnValue({ data: undefined, error: null, dataUpdatedAt: 0 });
    mocks.useLoadAiStatuses.mockReturnValue({ data: [], error: null, dataUpdatedAt: 0 });
    mocks.usePendingSuggestions.mockReturnValue({ data: [], error: null, dataUpdatedAt: 0 });
    mocks.useTmsTrucks.mockReturnValue({ data: { items: [] }, error: null, dataUpdatedAt: 0 });

    const { result } = renderHook(() => useTmsWorkspace());

    expect(result.current.shipments.map((shipment) => shipment.id)).toContain("stale-load");
    expect(result.current.updatedAt).toBe(1234);
    expect(result.current.refreshFailed).toBe(true);
  });
});
