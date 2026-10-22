import { describe, expect, it } from "vitest";

import { createTmsFlowGateway } from "@/api/tms-flow/tmsFlow.demo";
import {
  matchesShipmentQuery,
  selectDispatchFilterCounts,
  selectDispatchQueue,
  selectShipmentDetail,
} from "@/utils/tms-flow/selectors";

const loadSnapshot = () => createTmsFlowGateway({ latencyMs: 0 }).loadSnapshot();

describe("TMS flow selectors", () => {
  it("keeps delayed shipments inside the at-risk queue", async () => {
    const snapshot = await loadSnapshot();
    const ids = selectDispatchQueue(snapshot, "at-risk").map((shipment) => shipment.id);

    expect(ids).toContain("SF-48291");
    expect(ids).toContain("SF-49281");
    expect(ids.every((id) => {
      const shipment = snapshot.shipments.find((item) => item.id === id);
      return shipment?.status === "at_risk" || shipment?.status === "delayed";
    })).toBe(true);
  });

  it("lists only shipments with an open route approval", async () => {
    const snapshot = await loadSnapshot();
    const ids = selectDispatchQueue(snapshot, "approvals").map((shipment) => shipment.id);

    expect(ids).toContain("SF-48291");
    expect(ids).not.toContain("SF-49305");
  });

  it("searches id, customer, lane and PO", async () => {
    const snapshot = await loadSnapshot();
    const shipment = snapshot.shipments.find((item) => item.id === "SF-48291");

    expect(shipment).toBeDefined();
    expect(shipment && matchesShipmentQuery(shipment, "acme")).toBe(true);
    expect(shipment && matchesShipmentQuery(shipment, "77341")).toBe(true);
    expect(shipment && matchesShipmentQuery(shipment, "Miami")).toBe(false);
  });

  it("merges shipment, driver, vehicle, route and approval for the detail screen", async () => {
    const snapshot = await loadSnapshot();
    const detail = selectShipmentDetail(snapshot, "SF-48291");

    expect(detail?.driver?.name).toBe("Marcus Johnson");
    expect(detail?.vehicle?.id).toBe("V-204");
    expect(detail?.route?.id).toBe("R-48291");
    expect(detail?.approval?.id).toBe("AP-48291");
  });

  it("counts each filter from the same snapshot", async () => {
    const snapshot = await loadSnapshot();
    const counts = selectDispatchFilterCounts(snapshot);

    expect(counts.all).toBe(snapshot.shipments.length);
    expect(counts.approvals).toBe(
      snapshot.approvals.filter(
        (approval) => approval.state === "pending_approval" || approval.state === "under_review",
      ).length,
    );
  });
});
