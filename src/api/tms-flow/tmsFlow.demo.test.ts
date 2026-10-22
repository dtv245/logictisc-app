import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_TRACKING_PREFERENCES,
  TmsFlowConflictError,
  TmsFlowExpiredLinkError,
} from "@/api/tms-flow/tmsFlow.api";
import { createTmsFlowGateway } from "@/api/tms-flow/tmsFlow.demo";
import type { TmsFlowGateway } from "@/api/tms-flow/tmsFlow.api";
import { DEMO_NOW } from "@/utils/tms-flow/format";

describe("DemoTmsFlowGateway", () => {
  let gateway: TmsFlowGateway;

  beforeEach(() => {
    gateway = createTmsFlowGateway({ latencyMs: 0 });
  });

  it("approves a reroute once and updates the shipment ETA plus the audit trail", async () => {
    const before = await gateway.loadSnapshot();
    const approval = before.approvals.find((item) => item.id === "AP-48291");
    expect(approval).toBeDefined();

    await gateway.decideRouteChange("AP-48291", "approve");

    const after = await gateway.loadSnapshot();
    expect(after.approvals.find((item) => item.id === "AP-48291")?.state).toBe("applied");
    expect(after.shipments.find((item) => item.id === "SF-48291")?.currentEta).toBe(approval?.proposedEta);
    expect(after.audits[0]?.action).toBe("reroute_applied");
  });

  it("refuses a second decision on an already applied proposal", async () => {
    await gateway.decideRouteChange("AP-48291", "approve");

    await expect(gateway.decideRouteChange("AP-48291", "approve")).rejects.toBeInstanceOf(
      TmsFlowConflictError,
    );
  });

  it("fails a stale-approval scenario without mutating the proposal", async () => {
    gateway.configure({ scenario: "stale-approval" });

    await expect(gateway.decideRouteChange("AP-48291", "approve")).rejects.toBeInstanceOf(
      TmsFlowConflictError,
    );
    const after = await gateway.loadSnapshot();
    expect(after.approvals.find((item) => item.id === "AP-48291")?.state).toBe("pending_approval");
  });

  it("hides driver PII until the tracking link opts in", async () => {
    const link = await gateway.createTrackingLink({
      shipmentId: "SF-48291",
      recipients: [{ id: "ethan", name: "Ethan Cole", email: "ethan.cole@example.test" }],
      preferences: DEFAULT_TRACKING_PREFERENCES,
    });

    const hidden = await gateway.getLiveTracking(link.token, DEMO_NOW);
    expect(hidden.driver).toBeUndefined();

    await gateway.updateTrackingLink(link.token, {
      ...DEFAULT_TRACKING_PREFERENCES,
      driverName: true,
      driverPhone: false,
    });

    const named = await gateway.getLiveTracking(link.token, DEMO_NOW);
    expect(named.driver?.name).toBe("Marcus Johnson");
    expect(named.driver?.phone).toBe("");
  });

  it("rejects an expired tracking link without returning shipment data", async () => {
    const link = await gateway.createTrackingLink({
      shipmentId: "SF-48291",
      recipients: [],
      preferences: DEFAULT_TRACKING_PREFERENCES,
    });

    await expect(
      gateway.getLiveTracking(link.token, DEMO_NOW, { scenario: "expired-link" }),
    ).rejects.toBeInstanceOf(TmsFlowExpiredLinkError);
  });
});
