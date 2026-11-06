import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TmsFleetMap } from "@/components/tms-flow/TmsFleetMap";
import { selectDashboardAttentionTrucks } from "@/utils/tms-flow/fleet";
import type { TruckResponse } from "@/types/truck.dto";
import type { TmsShipmentView, TmsTruckCollection } from "@/types/tms-flow/tmsFlow.types";

vi.mock("@/components/tms-flow/TmsFlowMap", () => ({
  TmsFlowMap: ({ highlightedVehicleId }: { highlightedVehicleId?: string }) => (
    <output data-testid="focused-vehicle">{highlightedVehicleId ?? "none"}</output>
  ),
}));

const makeTruck = (overrides: Partial<TruckResponse> = {}): TruckResponse => ({
  id: "truck-1",
  number: "TRK-1",
  type: "BOX_TRUCK",
  vehicleCapacity: 10,
  status: "available",
  isHazmatPlacarded: false,
  adrEquipmentIsAdrCertified: false,
  currentLocationLatitude: 21.02,
  currentLocationLongitude: 105.84,
  ...overrides,
});

const makeRiskLoad = (truckId: string): TmsShipmentView => ({
  id: "load-1", number: 1, name: "Load", customerName: "Customer", rawStatus: "OPEN",
  status: "open", risk: "at_risk", originCity: "Hanoi", destinationCity: "Hai Phong",
  originAddress: "Hanoi", destinationAddress: "Hai Phong", distance: 1, isHazmat: false,
  raw: {} as TmsShipmentView["raw"], assignedTruckId: truckId,
});

const collection = (items: TruckResponse[]): TmsTruckCollection => ({
  items, totalItems: items.length, truncated: false,
});

describe("dashboard attention fleet", () => {
  it("includes trucks assigned to a risky load and trucks without valid coordinates", () => {
    const risky = makeTruck({ id: "risky", number: "R-1" });
    const noLocation = makeTruck({ id: "no-location", number: "N-1", currentLocationLatitude: null, currentLocationLongitude: null });
    const normal = makeTruck({ id: "normal", number: "N-2" });

    expect(selectDashboardAttentionTrucks([risky, noLocation, normal], [makeRiskLoad("risky")])
      .map((truck) => truck.id)).toEqual(["risky", "no-location"]);
  });

  it("searches by plate, shows actual status, and focuses a selected located truck", () => {
    render(
      <TmsFleetMap
        collection={collection([
          makeTruck({ id: "risk-truck", number: "TRK-10", licensePlate: "51A-12345" }),
          makeTruck({ id: "missing", number: "TRK-11", currentLocationLatitude: null, currentLocationLongitude: null }),
        ])}
        isLoading={false}
        riskLoads={[makeRiskLoad("risk-truck")]}
      />,
    );

    expect(screen.getByText(/2 xe đã tải: 2 sẵn sàng · 0 đang được sử dụng/)).toBeInTheDocument();
    expect(screen.getAllByText("Sẵn sàng")).toHaveLength(2);
    expect(screen.queryByText(/Đang chạy|Đang dừng/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("dashboard-fleet-truck-risk-truck"));
    expect(screen.getByTestId("focused-vehicle")).toHaveTextContent("risk-truck");

    fireEvent.change(screen.getByRole("textbox", { name: "Tìm theo biển số" }), { target: { value: "51A" } });
    expect(screen.getByTestId("dashboard-fleet-truck-risk-truck")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-fleet-truck-missing")).not.toBeInTheDocument();
  });
});
