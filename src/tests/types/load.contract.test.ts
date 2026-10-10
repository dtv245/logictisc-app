import { describe, expect, it } from "vitest";
import type { Load } from "@/types/load.types";
import type { LoadResponse } from "@/types/load.dto";
import { formatDateTime, formatDateOnly } from "@formatters/dateTime";

describe("Load contract and timestamp normalization", () => {
  const mockLoadPayload: LoadResponse = {
    id: "load-001",
    number: 1001,
    name: "Express Freight - Dallas to Austin",
    type: "dry_van",
    status: "dispatched",
    distance: 195.5,
    isInProximity: false,
    dispatchedAt: "2026-10-15T08:30:00Z",
    pickedUpAt: null,
    deliveredAt: null,
    cancelledAt: null,
    customerId: "cust-001",
    customerName: "Acme Logistics",
    source: "manual",
    requestedPickupDate: "2026-10-15T08:00:00Z",
    requestedDeliveryDate: "2026-10-15T18:00:00Z",
    notes: "Fragile cargo",
    isHazmat: false,
    deliveryCostAmount: 850.0, deliveryCostCurrency: "USD", version: 2,
    destinationAddressLine1: "100 Congress Ave",
    destinationAddressCity: "Austin",
    destinationAddressState: "TX",
    destinationAddressZipCode: "78701",
    destinationAddressCountry: "USA",
    destinationLocationLatitude: 30.2672, destinationLocationLongitude: -97.7431,
    originAddressLine1: "200 Main St",
    originAddressCity: "Dallas",
    originAddressState: "TX",
    originAddressZipCode: "75201",
    originAddressCountry: "USA",
    originLocationLatitude: 32.7767, originLocationLongitude: -96.797,
  };

  it("verifies mock API response assigns directly to Load domain model without Date conversion", () => {
    // Generic Refine dataProvider assigns raw API response to domain model
    const load: Load = mockLoadPayload;

    expect(load.id).toBe("load-001");
    expect(typeof load.requestedPickupDate).toBe("string");
    expect(typeof load.dispatchedAt).toBe("string");
    expect(load.pickedUpAt).toBeNull();
  });

  it("formats Load ISO timestamps correctly using formatters without throwing", () => {
    const load: Load = mockLoadPayload;

    const formattedCreated = formatDateTime(load.dispatchedAt, {
      locale: "en-GB",
      timeZone: "UTC",
    });
    expect(formattedCreated).toBe("15/10/2026, 08:30");

    const formattedPickup = formatDateOnly(load.requestedPickupDate, {
      locale: "en-GB",
      timeZone: "UTC",
    });
    expect(formattedPickup).toBe("15/10/2026");

    const formattedDelivered = formatDateTime(load.deliveredAt);
    expect(formattedDelivered).toBe("—");
  });
});
