import { describe, expect, it } from "vitest";

import type { LoadResponse } from "@/types/load.dto";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import {
  deriveOperationalStatus,
  deriveRisk,
  matchesTmsQuery,
  selectPrimaryRiskShipment,
  selectTmsCounts,
  selectTmsQueue,
  sortTmsQueue,
  summarizeTmsLoads,
  toTmsShipment,
} from "@/utils/tms-flow/status";

const NOW = new Date(2026, 9, 22, 12, 0, 0).getTime();
const HOUR = 3_600_000;

const makeLoad = (overrides: Partial<LoadResponse> = {}): LoadResponse => ({
  id: "load-1",
  number: 1001,
  name: "Test load",
  customerId: "customer-1",
  customerName: "Acme",
  status: "OPEN",
  type: "FTL",
  source: "MANUAL",
  distance: 120,
  isHazmat: false,
  isInProximity: false,
  originAddressCity: "Hanoi",
  destinationAddressCity: "Hai Phong",
  requestedDeliveryDate: new Date(NOW + 24 * HOUR).toISOString(),
  ...overrides,
});

const makeView = (overrides: Partial<TmsShipmentView> = {}): TmsShipmentView => ({
  ...toTmsShipment(makeLoad(), NOW),
  ...overrides,
});

describe("deriveOperationalStatus", () => {
  it("uses the documented priority: cancelled > delivered > in transit > dispatched > assigned > open", () => {
    expect(
      deriveOperationalStatus(
        makeLoad({
          cancelledAt: "2026-10-22T01:00:00.000Z",
          deliveredAt: "2026-10-22T02:00:00.000Z",
          pickedUpAt: "2026-10-22T03:00:00.000Z",
          dispatchedAt: "2026-10-22T04:00:00.000Z",
          assignedTruckId: "truck-1",
        }),
      ),
    ).toBe("cancelled");

    expect(
      deriveOperationalStatus(
        makeLoad({
          deliveredAt: "2026-10-22T02:00:00.000Z",
          pickedUpAt: "2026-10-22T03:00:00.000Z",
          dispatchedAt: "2026-10-22T04:00:00.000Z",
          assignedTruckId: "truck-1",
        }),
      ),
    ).toBe("delivered");

    expect(
      deriveOperationalStatus(
        makeLoad({
          pickedUpAt: "2026-10-22T03:00:00.000Z",
          dispatchedAt: "2026-10-22T04:00:00.000Z",
          assignedTruckId: "truck-1",
        }),
      ),
    ).toBe("in_transit");

    expect(
      deriveOperationalStatus(
        makeLoad({
          dispatchedAt: "2026-10-22T04:00:00.000Z",
          assignedTruckId: "truck-1",
        }),
      ),
    ).toBe("dispatched");

    expect(deriveOperationalStatus(makeLoad({ assignedTruckId: "truck-1" }))).toBe(
      "assigned",
    );
    expect(deriveOperationalStatus(makeLoad())).toBe("open");
  });
});

describe("deriveRisk", () => {
  it("marks a past due load delayed", () => {
    const load = makeLoad({
      requestedDeliveryDate: new Date(NOW - 1 * HOUR).toISOString(),
    });
    expect(deriveRisk(load, NOW)).toBe("delayed");
  });

  it("marks a load inside the window at risk, including the boundary", () => {
    const load = makeLoad({
      requestedDeliveryDate: new Date(NOW + 4 * HOUR).toISOString(),
    });
    expect(deriveRisk(load, NOW)).toBe("at_risk");
  });

  it("leaves loads beyond the window, terminal loads and missing dates on none", () => {
    expect(
      deriveRisk(
        makeLoad({
          requestedDeliveryDate: new Date(NOW + 4 * HOUR + 1).toISOString(),
        }),
        NOW,
      ),
    ).toBe("none");
    expect(
      deriveRisk(
        makeLoad({
          requestedDeliveryDate: new Date(NOW - HOUR).toISOString(),
          deliveredAt: new Date(NOW - 2 * HOUR).toISOString(),
        }),
        NOW,
      ),
    ).toBe("none");
    expect(
      deriveRisk(makeLoad({ requestedDeliveryDate: null }), NOW),
    ).toBe("none");
  });
});

describe("toTmsShipment", () => {
  it("maps only real load fields and keeps the raw projection", () => {
    const load = makeLoad({
      originAddressLine1: "1 Pickup St",
      originAddressState: "HN",
      destinationAddressLine1: "2 Delivery St",
      destinationAddressState: "HP",
      originLocationLatitude: 21.02,
      originLocationLongitude: 105.84,
      deliveryCostAmount: 500,
      deliveryCostCurrency: "USD",
      assignedTruckId: "truck-9",
      assignedTruckNumber: "TRK-9",
      hazmatClass: "3",
      isHazmat: true,
    });

    const view = toTmsShipment(load, NOW);

    expect(view.customerName).toBe("Acme");
    expect(view.originAddress).toBe("1 Pickup St, Hanoi, HN");
    expect(view.destinationAddress).toBe("2 Delivery St, Hai Phong, HP");
    expect(view.originLatitude).toBe(21.02);
    expect(view.deliveryCostAmount).toBe(500);
    expect(view.assignedTruckNumber).toBe("TRK-9");
    expect(view.hazmatClass).toBe("3");
    expect(view.raw).toBe(load);
  });

  it("uses a dash rather than inventing a customer name", () => {
    const view = toTmsShipment(makeLoad({ customerName: null }), NOW);
    expect(view.customerName).toBe("—");
    expect(view.originCity).toBe("Hanoi");
  });
});

describe("queue selectors", () => {
  it("filters terminal loads and searches number, customer and lane", () => {
    const open = makeView({ id: "a", number: 1, customerName: "Acme" });
    const delivered = makeView({ id: "b", status: "delivered" });
    const views = [open, delivered];

    expect(selectTmsQueue(views, "all", "", new Set())).toEqual([open]);
    expect(matchesTmsQuery(open, "acme")).toBe(true);
    expect(matchesTmsQuery(open, "hai phong")).toBe(true);
    expect(matchesTmsQuery(open, "1")).toBe(true);
    expect(matchesTmsQuery(open, "missing")).toBe(false);
  });

  it("filters at-risk, unassigned and approvals from the same queue", () => {
    const delayed = makeView({ id: "delayed", risk: "delayed" });
    const unassigned = makeView({ id: "unassigned", risk: "none" });
    const assigned = makeView({
      id: "assigned",
      risk: "none",
      assignedTruckId: "truck-1",
    });
    const views = [delayed, unassigned, assigned];

    expect(
      selectTmsQueue(views, "at-risk", "", new Set()).map((view) => view.id),
    ).toEqual(["delayed"]);
    expect(
      selectTmsQueue(views, "unassigned", "", new Set()).map((view) => view.id),
    ).toEqual(["delayed", "unassigned"]);
    expect(
      selectTmsQueue(views, "approvals", "", new Set(["assigned"])).map(
        (view) => view.id,
      ),
    ).toEqual(["assigned"]);
  });

  it("sorts delayed before at risk, then by earliest delivery", () => {
    const late = makeView({
      id: "late",
      risk: "at_risk",
      requestedDeliveryDate: new Date(NOW + HOUR).toISOString(),
    });
    const missing = makeView({
      id: "missing",
      risk: "none",
      requestedDeliveryDate: undefined,
    });
    const delayed = makeView({
      id: "delayed",
      risk: "delayed",
      requestedDeliveryDate: new Date(NOW - HOUR).toISOString(),
    });

    expect(sortTmsQueue([late, missing, delayed]).map((view) => view.id)).toEqual([
      "delayed",
      "late",
      "missing",
    ]);
  });

  it("counts only active loads and includes delayed inside at-risk", () => {
    const views = [
      makeView({ id: "delayed", risk: "delayed" }),
      makeView({ id: "risk", risk: "at_risk", assignedTruckId: "truck-1" }),
      makeView({ id: "clean", risk: "none", assignedTruckId: "truck-2" }),
      makeView({ id: "done", status: "delivered", risk: "none" }),
    ];

    expect(selectTmsCounts(views, 3)).toEqual({
      all: 3,
      atRisk: 2,
      unassigned: 1,
      approvals: 3,
    });
  });
});

describe("summarizeTmsLoads", () => {
  it("summarizes active, in transit, delivered today, delayed, at risk and unassigned", () => {
    const today = new Date(2026, 9, 22, 12, 0, 0);
    const deliveredToday = makeView({
      id: "done",
      status: "delivered",
      risk: "none",
      deliveredAt: new Date(2026, 9, 22, 9, 0, 0).toISOString(),
      assignedTruckId: "truck-1",
    });
    const deliveredYesterday = makeView({
      id: "old",
      status: "delivered",
      risk: "none",
      deliveredAt: new Date(2026, 9, 21, 9, 0, 0).toISOString(),
      assignedTruckId: "truck-1",
    });
    const views = [
      makeView({ id: "delayed", risk: "delayed" }),
      makeView({ id: "risk", risk: "at_risk", assignedTruckId: "truck-1" }),
      makeView({
        id: "transit",
        status: "in_transit",
        risk: "none",
        assignedTruckId: "truck-2",
      }),
      deliveredToday,
      deliveredYesterday,
    ];

    expect(summarizeTmsLoads(views, today)).toEqual({
      active: 3,
      inTransit: 1,
      deliveredToday: 1,
      delayed: 1,
      atRisk: 1,
      unassigned: 1,
    });
  });

  it("picks the primary risk load and ignores delivered loads", () => {
    const views = [
      makeView({ id: "done", risk: "delayed", status: "delivered" }),
      makeView({
        id: "late",
        risk: "delayed",
        requestedDeliveryDate: new Date(NOW - 2 * HOUR).toISOString(),
      }),
      makeView({
        id: "soon",
        risk: "at_risk",
        requestedDeliveryDate: new Date(NOW + HOUR).toISOString(),
      }),
    ];

    expect(selectPrimaryRiskShipment(views)?.id).toBe("late");
  });
});
