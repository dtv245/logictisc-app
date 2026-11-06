import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LoadResponse } from "@/types/load.dto";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";

const mocks = vi.hoisted(() => ({
  useOne: vi.fn(),
  useCurrentTenant: vi.fn(),
}));

vi.mock("@refinedev/core", () => ({ useOne: mocks.useOne }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: mocks.useCurrentTenant }));

import {
  selectMostUrgentDispatchShipment,
  useDispatchSelection,
} from "./useDispatchSelection";

const shipment = (id: string): TmsShipmentView => ({
  id,
  number: 1001,
  name: "Lô thử nghiệm",
  customerName: "Khách hàng",
  rawStatus: "OPEN",
  status: "open",
  risk: "none",
  originCity: "Hà Nội",
  destinationCity: "Hải Phòng",
  originAddress: "Hà Nội",
  destinationAddress: "Hải Phòng",
  distance: 100,
  isHazmat: false,
  raw: { id, number: 1001, status: "OPEN" } as LoadResponse,
});

const load = (id: string): LoadResponse => ({
  id,
  number: 1001,
  name: "Lô thử nghiệm",
  customerId: "customer-1",
  customerName: "Khách hàng",
  status: "OPEN",
  type: "FTL",
  source: "MANUAL",
  distance: 100,
  isHazmat: false,
  isInProximity: false,
} as LoadResponse);

const options = (overrides: Partial<Parameters<typeof useDispatchSelection>[0]> = {}) => ({
  requestedId: "load-requested",
  visibleShipments: [],
  knownShipments: [],
  defaultShipment: shipment("load-fallback"),
  filter: "all" as const,
  query: "",
  approvalLoadIds: new Set<string>(),
  ...overrides,
});

describe("useDispatchSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCurrentTenant.mockReturnValue({ tenant: { tenantKey: "tenant-a" } });
    mocks.useOne.mockReturnValue({ isLoading: false, isFetching: false, error: null });
  });

  it("keeps the requested shipment and keys get-one cache by tenant", () => {
    const current = shipment("load-requested");
    mocks.useOne.mockReturnValue({ isLoading: false, isFetching: false, error: null });

    const { result } = renderHook(() => useDispatchSelection(options({
      visibleShipments: [current],
      knownShipments: [current],
    })));

    expect(result.current).toEqual({
      status: "selected",
      shipment: current,
      outsideQueue: false,
    });
    expect(mocks.useOne).toHaveBeenCalledWith(expect.objectContaining({
      resource: "loads",
      id: undefined,
      queryOptions: expect.objectContaining({
        enabled: false,
        queryKey: ["tms", "tenant-a", "loads", "dispatch-selection", "load-requested"],
      }),
    }));
  });

  it("does not replace a linked shipment while it is being fetched", () => {
    mocks.useOne.mockReturnValue({ isLoading: true, isFetching: true, error: null });

    const { result } = renderHook(() => useDispatchSelection(options()));

    expect(result.current).toEqual({ status: "loading", outsideQueue: false });
    expect(mocks.useOne).toHaveBeenCalledWith(expect.objectContaining({
      resource: "loads",
      id: "load-requested",
      queryOptions: expect.objectContaining({ enabled: true }),
    }));
  });

  it("reports a load hidden by the active filter instead of choosing the fallback", () => {
    mocks.useOne.mockReturnValue({ isLoading: false, isFetching: false, error: null });

    const { result } = renderHook(() => useDispatchSelection(options({
      knownShipments: [shipment("load-requested")],
      visibleShipments: [],
      filter: "unassigned",
    })));

    expect(result.current).toEqual({ status: "hidden", outsideQueue: false });
  });

  it.each([403, 404])("shows the not-found state for get-one status %s", (statusCode) => {
    mocks.useOne.mockReturnValue({
      isLoading: false,
      isFetching: false,
      error: { statusCode, message: "Unavailable" },
    });

    const { result } = renderHook(() => useDispatchSelection(options()));

    expect(result.current).toEqual({ status: "not-found", outsideQueue: false });
  });

  it("keeps a retryable error distinct from not-found", () => {
    mocks.useOne.mockReturnValue({
      isLoading: false,
      isFetching: false,
      error: { statusCode: 500, message: "Network unavailable" },
    });

    const { result } = renderHook(() => useDispatchSelection(options()));

    expect(result.current).toMatchObject({
      status: "error",
      error: { statusCode: 500, message: "Network unavailable" },
      outsideQueue: false,
    });
    expect(result.current.status === "error" && result.current.retry).toEqual(expect.any(Function));
  });

  it("selects a get-one result if it passes the active filters", () => {
    mocks.useOne.mockReturnValue({
      data: { data: load("load-requested") },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    const { result } = renderHook(() => useDispatchSelection(options()));

    expect(result.current.status).toBe("selected");
    expect(result.current.status === "selected" && result.current.outsideQueue).toBe(true);
    expect(result.current.status === "selected" && result.current.shipment.id).toBe("load-requested");
  });

  it("uses the default shipment only when the URL has no shipment id", () => {
    const fallback = shipment("load-fallback");

    const { result } = renderHook(() => useDispatchSelection(options({
      requestedId: null,
      defaultShipment: fallback,
    })));

    expect(result.current).toEqual({ status: "selected", shipment: fallback, outsideQueue: false });
  });
});

describe("selectMostUrgentDispatchShipment", () => {
  it("prioritizes risk, then missing truck, then the closest delivery time", () => {
    const laterUnassigned = {
      ...shipment("unassigned-later"),
      requestedDeliveryDate: "2026-11-10T12:00:00Z",
    };
    const earlierAssigned = {
      ...shipment("assigned-earlier"),
      assignedTruckId: "truck-1",
      requestedDeliveryDate: "2026-11-07T12:00:00Z",
    };
    const urgentRisk = {
      ...shipment("risk"),
      risk: "at_risk" as const,
      requestedDeliveryDate: "2026-11-12T12:00:00Z",
    };

    expect(selectMostUrgentDispatchShipment([earlierAssigned, laterUnassigned, urgentRisk]))
      .toBe(urgentRisk);
    expect(selectMostUrgentDispatchShipment([earlierAssigned, laterUnassigned]))
      .toBe(laterUnassigned);
    expect(selectMostUrgentDispatchShipment([earlierAssigned, {
      ...shipment("assigned-later"),
      assignedTruckId: "truck-2",
      requestedDeliveryDate: "2026-11-09T12:00:00Z",
    }]))
      .toMatchObject({ id: "assigned-earlier" });
  });
});
