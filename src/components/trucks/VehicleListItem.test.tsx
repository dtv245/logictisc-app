import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Vehicle } from "@/types/trucks/vehicle.types";

import { VehicleListItem } from "./VehicleListItem";
import { VehiclePrimaryInfo } from "./VehiclePrimaryInfo";
import { VehicleStatus } from "./VehicleStatus";

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: "vehicle-1",
  version: 1,
  number: "TRK-UPD-1791603980",
  type: "SEMI",
  vehicleCapacity: 46_000,
  status: "AVAILABLE",
  make: "Freightliner",
  model: "Cascadia Evolution",
  year: 2024,
  vin: null,
  licensePlate: null,
  licensePlateState: null,
  isHazmatPlacarded: false,
  mainDriverId: null,
  mainDriverName: null,
  secondaryDriverId: null,
  secondaryDriverName: null,
  adrEquipmentIsAdrCertified: false,
  adrEquipmentAllowedClasses: "",
  currentLocationLatitude: null,
  currentLocationLongitude: null,
  ...overrides,
});

const renderVehicle = (vehicle = makeVehicle(), overrides: Partial<{
  onDetail: (value: Vehicle) => void;
  onEdit: (value: Vehicle) => void;
  onViewRegistration: (value: Vehicle) => void;
  onAssignDriver: (value: Vehicle) => void;
  onDeactivate: (value: Vehicle) => void;
}> = {}) => {
  const handlers = {
    onDetail: vi.fn(),
    onEdit: vi.fn(),
    onViewRegistration: vi.fn(),
    onAssignDriver: vi.fn(),
    onDeactivate: vi.fn(),
    ...overrides,
  };
  render(<VehicleListItem vehicle={vehicle} canEdit canDeactivate {...handlers} />);
  return handlers;
};

describe("vehicle list item", () => {
  it("shows the vehicle number and missing-plate badge when the plate is null", () => {
    const vehicle = makeVehicle({ licensePlate: null, make: null, model: null });
    render(<VehiclePrimaryInfo vehicle={vehicle} />);

    expect(screen.getByText("TRK-UPD-1791603980")).toBeInTheDocument();
    expect(screen.getByText("Chưa có biển số")).toBeInTheDocument();
    expect(screen.getByText("Xe đầu kéo (Semi)")).toBeInTheDocument();
    expect(screen.queryByText(/null|undefined/i)).not.toBeInTheDocument();
  });

  it("keeps an unknown status unchanged and uses the neutral gray dot", () => {
    const { container } = render(<VehicleStatus status="PENDING" />);

    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toHaveStyle({
      backgroundColor: "#98A2B3",
    });
  });

  it("does not open details when the quick edit or deactivate actions are clicked", () => {
    const vehicle = makeVehicle();
    const handlers = renderVehicle(vehicle);

    fireEvent.click(screen.getByRole("button", { name: "Sửa xe TRK-UPD-1791603980" }));
    expect(handlers.onEdit).toHaveBeenCalledWith(vehicle);
    expect(handlers.onDetail).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Vô hiệu hóa xe TRK-UPD-1791603980" }));
    expect(handlers.onDeactivate).toHaveBeenCalledWith(vehicle);
    expect(handlers.onDetail).not.toHaveBeenCalled();
  });

  it("stops a dropdown action from bubbling to the card", async () => {
    const vehicle = makeVehicle();
    const handlers = renderVehicle(vehicle);

    fireEvent.click(screen.getByRole("button", { name: "Thao tác nhanh" }));
    fireEvent.click(await screen.findByText("Lịch sử đăng kiểm"));

    expect(handlers.onViewRegistration).toHaveBeenCalledWith(vehicle);
    expect(handlers.onDetail).not.toHaveBeenCalled();
  });
});
