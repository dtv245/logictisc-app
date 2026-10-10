import { describe, expect, it } from "vitest";
import type { Trip } from "@/types/trip.types";
import type { TripResponse } from "@/types/trip.dto";
import { formatDateTime } from "@formatters/dateTime";

describe("Trip contract and timestamp normalization", () => {
  const mockTripPayload: TripResponse = {
    id: "trip-001",
    number: 501,
    name: "Route 35 Southbound",
    version: 2,
    totalDistance: 210.0,
    dispatchedAt: "2026-10-15T09:00:00Z",
    completedAt: null,
    cancelledAt: null,
    status: "dispatched",
    truckId: "trk-101",
    truckNumber: "TRK-101",
  };

  it("verifies mock API response assigns directly to Trip domain model without Date conversion", () => {
    // Generic Refine dataProvider assigns raw API response to domain model
    const trip: Trip = mockTripPayload;

    expect(trip.id).toBe("trip-001");
    expect(typeof trip.dispatchedAt).toBe("string");
    expect(typeof trip.dispatchedAt).toBe("string");
    expect(trip.completedAt).toBeNull();
  });

  it("formats Trip ISO timestamps correctly using formatters without throwing", () => {
    const trip: Trip = mockTripPayload;

    const formattedDispatched = formatDateTime(trip.dispatchedAt, {
      locale: "en-GB",
      timeZone: "UTC",
    });
    expect(formattedDispatched).toBe("15/10/2026, 09:00");

    const formattedCompleted = formatDateTime(trip.completedAt);
    expect(formattedCompleted).toBe("—");
  });
});
