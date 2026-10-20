import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePriorityShipments } from "@/hooks/dashboard/usePriorityShipments";
import type { Load } from "@/types/load.types";

const mocks = vi.hoisted(() => ({ access: vi.fn(), list: vi.fn(), refetch: vi.fn(), accessRefetch: vi.fn() }));
vi.mock("@refinedev/core", () => ({ useCan: mocks.access, useList: mocks.list }));

const load: Load = {
  id: "load-1", number: 1001, name: "Chuyến kiểm thử", status: "in_transit", type: "reefer",
  customerId: "customer-1", customerName: "Khách hàng A", distance: 100, isHazmat: false, isInProximity: false, source: "manual",
  originAddressCity: "Hà Nội", destinationAddressCity: "Hải Phòng", requestedDeliveryDate: "2026-10-16T08:30:00Z",
  assignedTruckNumber: "29H-12345", assignedDispatcherName: "Điều phối viên, không phải tài xế",
};

describe("usePriorityShipments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.access.mockReturnValue({ data: { can: true }, isLoading: false, isError: false, refetch: mocks.accessRefetch });
    mocks.list.mockReturnValue({ data: { data: [load] }, isLoading: false, isError: false, refetch: mocks.refetch });
  });

  it("uses load read permission and the existing filtered resource query", () => {
    renderHook(() => usePriorityShipments());
    expect(mocks.access).toHaveBeenCalledWith({ resource: "loads", action: "list" });
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ resource: "loads", filters: [{ field: "status", operator: "eq", value: "in_transit" }], queryOptions: expect.objectContaining({ enabled: true }) }));
  });

  it("maps real load values without inventing ETA, a driver or telemetry", () => {
    const { result } = renderHook(() => usePriorityShipments());
    const shipment = result.current.shipments[0];
    expect(shipment).toMatchObject({ id: "load-1", reference: "#1001", origin: "Hà Nội", destination: "Hải Phòng", vehicleLabel: "29H-12345" });
    expect(shipment.scheduledDelivery).toBeDefined();
    for (const field of ["eta", "deliveryWindow", "detour", "driver", "speed", "fuel", "reefer", "cargo", "progressPercent"]) expect(shipment).not.toHaveProperty(field);
    expect(shipment.stops?.every((stop) => stop.time === undefined && !stop.completed)).toBe(true);
  });

  it("disables fetching and hides cached records when permission is denied", () => {
    mocks.access.mockReturnValue({ data: { can: false }, isLoading: false, isError: false, refetch: mocks.accessRefetch });
    const { result } = renderHook(() => usePriorityShipments());
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ queryOptions: expect.objectContaining({ enabled: false }) }));
    expect(result.current.shipments).toEqual([]);
    expect(result.current.error).toContain("quyền");
    result.current.retry();
    expect(mocks.accessRefetch).toHaveBeenCalledOnce();
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it("shows an error and supports retry when the load query fails", () => {
    mocks.list.mockReturnValue({ isLoading: false, isError: true, refetch: mocks.refetch });
    const { result } = renderHook(() => usePriorityShipments());
    expect(result.current.shipments).toEqual([]);
    expect(result.current.error).toContain("Không tải được");
    result.current.retry();
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("keeps a successful empty response empty", () => {
    mocks.list.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false, refetch: mocks.refetch });
    const { result } = renderHook(() => usePriorityShipments());
    expect(result.current.shipments).toEqual([]);
    expect(result.current.isUnavailable).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("marks an absent live dataset unavailable without substituting preview shipments", () => {
    mocks.list.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: mocks.refetch });
    const { result } = renderHook(() => usePriorityShipments());
    expect(result.current.shipments).toEqual([]);
    expect(result.current.isUnavailable).toBe(true);
    expect(result.current.shipments.map(({ id, reference }) => `${id} ${reference}`).join(" ")).not.toMatch(/LD-84920|demo-load/);
  });
});
