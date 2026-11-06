import { describe, expect, it } from "vitest";

import { formatTmsOverdueDuration, getTmsOverdue } from "@/utils/tms-flow/overdue";
import type { LoadResponse } from "@/types/load.dto";

const NOW = Date.parse("2026-11-06T12:00:00.000Z");
const makeLoad = (overrides: Partial<LoadResponse> = {}): LoadResponse => ({
  id: "load-1",
  number: 1,
  name: "Test",
  customerId: "customer-1",
  status: "OPEN",
  type: "FTL",
  source: "MANUAL",
  distance: 1,
  isHazmat: false,
  isInProximity: false,
  ...overrides,
});

describe("getTmsOverdue", () => {
  it("detects an overdue pickup only before pickup has been recorded", () => {
    const overdue = getTmsOverdue(makeLoad({
      requestedPickupDate: "2026-11-05T12:00:00.000Z",
      requestedDeliveryDate: "2026-11-07T12:00:00.000Z",
    }), NOW);

    expect(overdue.reasons).toMatchObject([{ kind: "pickup", overdueMilliseconds: 86_400_000 }]);
  });

  it("detects an overdue delivery after pickup", () => {
    const overdue = getTmsOverdue(makeLoad({
      pickedUpAt: "2026-11-05T10:00:00.000Z",
      requestedDeliveryDate: "2026-11-05T12:00:00.000Z",
    }), NOW);

    expect(overdue.reasons).toMatchObject([{ kind: "delivery", overdueMilliseconds: 86_400_000 }]);
  });

  it("returns both reasons with the most overdue deadline first", () => {
    const overdue = getTmsOverdue(makeLoad({
      requestedPickupDate: "2026-11-04T12:00:00.000Z",
      requestedDeliveryDate: "2026-11-05T12:00:00.000Z",
    }), NOW);

    expect(overdue.reasons.map(({ kind }) => kind)).toEqual(["pickup", "delivery"]);
    expect(overdue.mostOverdueMilliseconds).toBe(172_800_000);
  });

  it.each([
    ["delivered", { deliveredAt: "2026-11-06T11:00:00.000Z" }],
    ["cancelled", { cancelledAt: "2026-11-06T11:00:00.000Z" }],
  ])("excludes a %s load", (_label, timestamps) => {
    expect(getTmsOverdue(makeLoad({
      requestedPickupDate: "2026-11-01T12:00:00.000Z",
      requestedDeliveryDate: "2026-11-02T12:00:00.000Z",
      ...timestamps,
    }), NOW).reasons).toEqual([]);
  });

  it("does not treat a past pickup deadline as overdue after pickup", () => {
    expect(getTmsOverdue(makeLoad({
      requestedPickupDate: "2026-11-05T12:00:00.000Z",
      pickedUpAt: "2026-11-05T13:00:00.000Z",
      requestedDeliveryDate: "2026-11-07T12:00:00.000Z",
    }), NOW).reasons).toEqual([]);
  });

  it("formats delay in whole days or hours", () => {
    expect(formatTmsOverdueDuration(20 * 86_400_000)).toEqual({ amount: 20, unit: "days" });
    expect(formatTmsOverdueDuration(2.8 * 3_600_000)).toEqual({ amount: 2, unit: "hours" });
  });
});
