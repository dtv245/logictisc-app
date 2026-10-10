import { describe, expect, it } from "vitest";
import { formatDateTime } from "@formatters/dateTime";
import type { AccessorialChargeView } from "@/types/accessorial.types";
import type { LoadTimelineResponse } from "@/types/loadTimeline.types";
import type { ShipmentCostView } from "@/types/shipmentCost.types";

describe("Load Timeline and Costs contract tests", () => {
  it("verifies LoadTimelineResponse and LoadEventView contracts with ISO timestamps", () => {
    const timeline: LoadTimelineResponse = {
      loadId: "load-1",
      loadNumber: "LD-100",
      currentStatus: "DELIVERED",
      events: [
        {
          id: "evt-1",
          loadId: "load-1",
          eventType: "DELIVERED",
          previousStatus: "IN_TRANSIT",
          newStatus: "DELIVERED",
          occurredAt: "2026-10-04T12:00:00Z",
          latitude: 32.77,
          longitude: -96.79,
        },
      ],
    };

    expect(timeline.loadId).toBe("load-1");
    expect(timeline.events).toHaveLength(1);
    expect(formatDateTime(timeline.events[0].occurredAt, { timeZone: "UTC", locale: "en-GB" })).toBe(
      "04/10/2026, 12:00",
    );
  });

  it("verifies ShipmentCostView contract with monetary amount and currency", () => {
    const cost: ShipmentCostView = {
      id: "c1",
      loadId: "load-1",
      category: "FUEL",
      costBasis: "ACTUAL_EXPENSE",
      status: "POSTED",
      amount: 320.5,
      currency: "USD",
      incurredAt: "2026-10-04T08:00:00Z",
    };

    expect(cost.amount).toBe(320.5);
    expect(cost.currency).toBe("USD");
    expect(cost.category).toBe("FUEL");
  });

  it("verifies AccessorialChargeView contract with quantities and amounts", () => {
    const charge: AccessorialChargeView = {
      id: "a1",
      loadId: "load-1",
      type: "DETENTION",
      status: "APPROVED",
      quantity: 3,
      unit: "HOURS",
      rate: 80,
      customerAmount: 240,
      companyCostAmount: 100,
      driverPayAmount: 140,
      currency: "USD",
      occurredAt: "2026-10-04T10:00:00Z",
    };

    expect(charge.customerAmount).toBe(240);
    expect(charge.driverPayAmount).toBe(140);
    expect(charge.status).toBe("APPROVED");
  });
});
