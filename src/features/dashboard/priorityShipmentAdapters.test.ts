import { describe, expect, it } from "vitest";
import { adaptLiveLoadToPriorityShipment, adaptPreviewShipment } from "@/features/dashboard/priorityShipmentAdapters";
import type { Load } from "@/types/load.types";
import type { PriorityShipmentViewModel } from "@/types/dashboard/priority-shipment.types";

const load: Load = {
  id: "load-live-42",
  number: 42,
  name: "Contract-backed Load",
  status: "in_transit",
  type: "reefer",
  distance: 100,
  isHazmat: false,
  isInProximity: false,
  customerId: "customer-live-42",
  source: "manual",
  originAddressCity: "Hà Nội",
  destinationAddressCity: "Hải Phòng",
  customerName: "Khách hàng A",
  assignedTruckNumber: "29H-12345",
  requestedDeliveryDate: "2026-10-20T08:30:00Z",
};

describe("Priority Shipment presentation adapters", () => {
  it("maps live Load fields and leaves unsupported ETA/telemetry absent", () => {
    const viewModel = adaptLiveLoadToPriorityShipment(load, "vi", (status) => status);

    expect(viewModel).toMatchObject({
      id: "load-live-42",
      reference: "#42",
      origin: "Hà Nội",
      destination: "Hải Phòng",
      customer: "Khách hàng A",
      vehicleLabel: "29H-12345",
    });
    for (const field of ["eta", "deliveryWindow", "detour", "driver", "speed", "fuel", "reefer", "cargo", "progressPercent"]) {
      expect(viewModel).not.toHaveProperty(field);
    }
  });

  it("copies an explicitly supplied preview fixture through the same view-model contract", () => {
    const preview: PriorityShipmentViewModel = {
      id: "preview-1",
      reference: "PREVIEW-1",
      origin: "Origin",
      destination: "Destination",
      status: { label: "Sample", tone: "warning" },
      stops: [{ id: "preview-origin", name: "Origin" }],
    };

    const viewModel = adaptPreviewShipment(preview);
    expect(viewModel).toEqual(preview);
    expect(viewModel).not.toBe(preview);
    expect(viewModel.stops).not.toBe(preview.stops);
  });
});
