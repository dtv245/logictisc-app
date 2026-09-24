import { describe, expect, it } from "vitest";

import { toVehicleMapPoints, type OperationsTruckRecord } from "@features/operations/operations.data";

const truck = (
  overrides: Partial<OperationsTruckRecord> = {},
): OperationsTruckRecord => ({
  id: "truck-1",
  number: "TRK-001",
  status: "available",
  ...overrides,
});

describe("toVehicleMapPoints", () => {
  it("maps valid backend coordinates and prefers the license plate", () => {
    expect(
      toVehicleMapPoints([
        truck({
          currentLocationLatitude: 10.7769,
          currentLocationLongitude: 106.7009,
          licensePlate: "51C-123.45",
        }),
      ]),
    ).toEqual([
      {
        id: "truck-1",
        label: "51C-123.45",
        latitude: 10.7769,
        longitude: 106.7009,
        status: "available",
      },
    ]);
  });

  it("drops missing and out-of-range coordinates instead of inventing a position", () => {
    expect(
      toVehicleMapPoints([
        truck(),
        truck({
          id: "truck-2",
          currentLocationLatitude: 91,
          currentLocationLongitude: 106,
        }),
        truck({
          id: "truck-3",
          currentLocationLatitude: 10,
          currentLocationLongitude: Number.NaN,
        }),
      ]),
    ).toEqual([]);
  });
});

