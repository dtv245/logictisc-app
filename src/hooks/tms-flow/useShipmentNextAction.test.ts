import { describe, expect, it } from "vitest";

import type { TmsApproval, TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";

import { useShipmentNextAction } from "./useShipmentNextAction";
import { renderHook } from "@testing-library/react";

const makeShipment = (overrides: Partial<TmsShipmentView> = {}): TmsShipmentView => ({
  id: "load-1",
  number: 1,
  name: "Lô hàng",
  customerName: "Khách hàng",
  rawStatus: "OPEN",
  status: "open",
  risk: "none",
  originCity: "Hà Nội",
  destinationCity: "Đà Nẵng",
  originAddress: "Hà Nội",
  destinationAddress: "Đà Nẵng",
  distance: 100,
  isHazmat: false,
  raw: {} as TmsShipmentView["raw"],
  ...overrides,
});

const makeApproval = (): TmsApproval => ({
  suggestion: {
    decisionId: "decision-1",
    truckId: "truck-1",
    driverId: "driver-1",
    status: "PENDING",
    reasoning: "Xe phù hợp",
  },
  load: makeShipment(),
});

describe("useShipmentNextAction", () => {
  it("prioritizes risk over an available suggestion", () => {
    const approval = makeApproval();
    const { result } = renderHook(() => useShipmentNextAction({
      shipment: makeShipment({ risk: "delayed", riskReasons: [{ code: "DELIVERY_OVERDUE", message: "Quá hạn", dueAt: "2026-10-01T00:00:00Z" }] }),
      approvals: [approval],
    }));

    expect(result.current).toEqual({ kind: "risk", reason: expect.stringContaining("Quá hạn giao") });
  });

  it("offers the real pending suggestion for an unassigned load", () => {
    const approval = makeApproval();
    const { result } = renderHook(() => useShipmentNextAction({ shipment: makeShipment(), approvals: [approval] }));

    expect(result.current).toEqual({ kind: "approve-suggestion", approval });
  });

  it("keeps manual assignment disabled when there is no valid existing route", () => {
    const { result } = renderHook(() => useShipmentNextAction({ shipment: makeShipment(), approvals: [] }));

    expect(result.current).toEqual({ kind: "manual-assignment-unavailable" });
  });

  it("does nothing for an assigned load without an outstanding risk", () => {
    const { result } = renderHook(() => useShipmentNextAction({
      shipment: makeShipment({ assignedTruckId: "truck-1" }),
      approvals: [makeApproval()],
    }));

    expect(result.current).toEqual({ kind: "none" });
  });
});
