/**
 * In-browser demo implementation of the TMS flow gateway.
 *
 * All mutations stay inside one module-level store so a later screen (for
 * example live tracking) observes what an earlier screen changed. Nothing is
 * sent to the backend.
 */

import {
  TmsFlowConflictError,
  TmsFlowExpiredLinkError,
  TmsFlowPermissionError,
  TmsFlowValidationError,
  type CreateTrackingInput,
  type GatewayOptions,
  type RouteDecision,
  type TmsFlowGateway,
} from "@/api/tms-flow/tmsFlow.api";
import { tmsFlowFixtures } from "@/api/tms-flow/tmsFlow.fixtures";
import type {
  AutoAssignCandidate,
  AutoAssignResult,
  LiveTrackingView,
  Message,
  MessageDraft,
  NewShipmentInput,
  RouteApproval,
  RoutePlan,
  RouteStop,
  TmsFlowSnapshot,
  TmsScenario,
  TrackingLink,
  TrackingPreferences,
} from "@/types/tms-flow/tmsFlow.types";
import { DEMO_NOW, addMinutes } from "@/utils/tms-flow/format";

const clone = <T>(value: T): T => structuredClone(value);

const LATENCY_MS = 120;

class DemoTmsFlowGateway implements TmsFlowGateway {
  private store: TmsFlowSnapshot;
  private scenario: TmsScenario = "normal";
  private readOnly = false;
  private counter = 100;
  private readonly latencyMs: number;

  constructor(latencyMs: number) {
    this.latencyMs = latencyMs;
    this.store = clone(tmsFlowFixtures);
  }

  configure(options: GatewayOptions): void {
    if (options.scenario) this.scenario = options.scenario;
    if (options.readOnly !== undefined) this.readOnly = options.readOnly;
  }

  reset(): void {
    this.store = clone(tmsFlowFixtures);
    this.scenario = "normal";
    this.readOnly = false;
    this.counter = 100;
  }

  private async respond<T>(value: T): Promise<T> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
    return clone(value);
  }

  private guardMutation(): void {
    if (this.scenario === "network-error") {
      throw new Error("Demo network error. Nothing was sent to the backend.");
    }
    if (this.readOnly || this.scenario === "read-only") {
      throw new TmsFlowPermissionError("This demo is running in read-only mode.");
    }
  }

  private nextId(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }

  private audit(action: string, detail: string): void {
    this.store.audits.unshift({
      id: this.nextId("AUD"),
      at: DEMO_NOW,
      actor: this.store.operatorName,
      action,
      detail,
    });
  }

  async loadSnapshot(): Promise<TmsFlowSnapshot> {
    return this.respond(this.store);
  }

  async createShipment(input: NewShipmentInput): Promise<{ shipmentId: string }> {
    this.guardMutation();
    if (!input.customer.trim() || !input.po.trim() || !input.origin.trim() || !input.destination.trim()) {
      throw new TmsFlowValidationError("Customer, PO, origin and destination are required.");
    }
    if (input.pallets <= 0 || input.weightLb <= 0) {
      throw new TmsFlowValidationError("Pallets and weight must be greater than zero.");
    }

    const shipmentId = this.store.shipments.some((shipment) => shipment.id === "SF-49412")
      ? `SF-${49412 + this.counter}`
      : "SF-49412";
    const suggestedDriver = this.store.drivers.find((driver) => driver.id === "D-MICHAEL");
    const suggestedVehicle = this.store.vehicles.find((vehicle) => vehicle.driverId === "D-MICHAEL");

    this.store.shipments.unshift({
      id: shipmentId,
      customer: input.customer,
      contactName: input.contactName,
      po: input.po,
      origin: input.origin,
      destination: input.destination,
      pickup: input.pickup,
      delivery: input.delivery,
      status: input.assignSuggestedDriver ? "assigned" : "booked",
      priority: "priority",
      pallets: input.pallets,
      weightLb: input.weightLb,
      equipment: input.equipment,
      currentEta: addMinutes(input.delivery.end, 18),
      ...(input.assignSuggestedDriver && suggestedDriver ? { driverId: suggestedDriver.id } : {}),
      ...(input.assignSuggestedDriver && suggestedVehicle ? { vehicleId: suggestedVehicle.id } : {}),
    });
    this.audit("shipment_created", `${shipmentId} created for ${input.customer}.${input.notifyCustomer ? " Customer update queued (demo)." : ""}`);

    return this.respond({ shipmentId });
  }

  async autoAssign(loadIds: string[]): Promise<AutoAssignResult> {
    this.guardMutation();
    if (this.scenario === "stale-assignment") {
      throw new TmsFlowConflictError("Driver availability changed. Reload the suggestions and try again.");
    }
    if (loadIds.length === 0) {
      throw new TmsFlowValidationError("Select at least one load.");
    }

    const candidates: AutoAssignCandidate[] = loadIds.map((loadId, index) => {
      const driver = this.store.drivers[index % this.store.drivers.length];
      const blocked = loadId === "SF-49311";
      return {
        loadId,
        driverId: driver.id,
        driverName: driver.name,
        matchPercent: 96 - index,
        ready: !blocked,
        ...(blocked ? { reason: "Needs a dock slot before assignment." } : {}),
      };
    });

    const blocked = candidates.find((candidate) => !candidate.ready);
    if (blocked) {
      throw new TmsFlowConflictError(`${blocked.loadId}: ${blocked.reason ?? "not ready"}`);
    }

    for (const candidate of candidates) {
      const shipment = this.store.shipments.find((item) => item.id === candidate.loadId);
      if (!shipment) throw new TmsFlowValidationError(`Unknown load ${candidate.loadId}.`);
      shipment.driverId = candidate.driverId;
      shipment.status = "assigned";
      const vehicle = this.store.vehicles.find((item) => item.driverId === candidate.driverId);
      if (vehicle) shipment.vehicleId = vehicle.id;
    }

    this.audit("loads_auto_assigned", `${candidates.length} loads assigned to ${new Set(candidates.map((c) => c.driverId)).size} drivers.`);
    return this.respond({ candidates, assignedCount: candidates.length, skippedCount: 0 });
  }

  async applyOptimizedRoute(routeId: string): Promise<RoutePlan> {
    this.guardMutation();
    const route = this.requireRoute(routeId);
    route.mode = "optimized";
    this.audit("route_applied", `${route.id} switched to the optimized order (${route.optimized.miles.toFixed(1)} mi).`);
    return this.respond(route);
  }

  async saveRouteStops(routeId: string, stops: RouteStop[]): Promise<RoutePlan> {
    this.guardMutation();
    const route = this.requireRoute(routeId);
    route.stops = clone(stops);
    this.audit("route_stops_saved", `${route.id} stop order updated (${stops.length} stops).`);
    return this.respond(route);
  }

  async decideRouteChange(approvalId: string, decision: RouteDecision, reason?: string): Promise<RouteApproval> {
    this.guardMutation();
    if (this.scenario === "stale-approval") {
      throw new TmsFlowConflictError("This proposal changed while you were reviewing it. Reload to see the latest version.");
    }
    const approval = this.store.approvals.find((item) => item.id === approvalId);
    if (!approval) throw new TmsFlowValidationError("Route approval not found.");
    if (approval.state !== "pending_approval" && approval.state !== "under_review") {
      throw new TmsFlowConflictError("This proposal has already been decided.");
    }

    if (decision === "reject") {
      approval.state = "rejected";
      this.audit("reroute_rejected", `${approval.shipmentId}: ${approval.proposedRoute} proposal rejected.${reason ? ` Reason: ${reason}` : ""}`);
      return this.respond(approval);
    }

    approval.state = "applied";
    const shipment = this.store.shipments.find((item) => item.id === approval.shipmentId);
    if (shipment) {
      shipment.currentEta = approval.proposedEta;
      delete shipment.proposedEta;
      shipment.status = "in_transit";
      const route = shipment.routeId ? this.store.routes.find((item) => item.id === shipment.routeId) : undefined;
      if (route) {
        route.mode = "optimized";
        route.name = `${approval.proposedRoute} corridor`;
      }
    }
    this.audit(
      "reroute_applied",
      `${approval.shipmentId}: ${approval.proposedRoute} approved. ETA ${approval.proposedEta}; saves ${approval.savedMinutes} minutes for +${(approval.proposedMiles - approval.currentMiles).toFixed(1)} mi.`,
    );
    return this.respond(approval);
  }

  async sendMessage(draft: MessageDraft): Promise<Message> {
    this.guardMutation();
    if (!draft.to.trim() || !draft.subject.trim() || !draft.body.trim()) {
      throw new TmsFlowValidationError("Recipient, subject and message are required.");
    }
    const thread =
      this.store.threads.find((item) => item.id === draft.threadId) ??
      this.store.threads.find((item) => item.shipmentId === draft.shipmentId) ??
      this.store.threads[0];
    const message: Message = {
      id: this.nextId("M"),
      threadId: thread.id,
      from: this.store.operatorName,
      to: draft.to,
      channel: draft.channel,
      subject: draft.subject,
      body: draft.body,
      at: DEMO_NOW,
    };
    thread.messages.push(message);
    thread.lastMessageAt = DEMO_NOW;
    thread.unread = false;
    this.audit("message_sent", `${draft.channel} message sent to ${draft.to} (demo only).`);
    return this.respond(message);
  }

  async createTrackingLink(input: CreateTrackingInput): Promise<TrackingLink> {
    this.guardMutation();
    const shipment = this.store.shipments.find((item) => item.id === input.shipmentId);
    if (!shipment) throw new TmsFlowValidationError("Shipment not found.");

    const existing = this.store.trackingLinks.find((link) => link.shipmentId === input.shipmentId);
    if (existing) {
      existing.recipients = clone(input.recipients);
      existing.preferences = clone(input.preferences);
      return this.respond(existing);
    }

    const link: TrackingLink = {
      token: `demo-${input.shipmentId}-link`,
      shipmentId: input.shipmentId,
      recipients: clone(input.recipients),
      preferences: clone(input.preferences),
      createdAt: DEMO_NOW,
      expiresAt: addMinutes(shipment.delivery.end, 24 * 60),
    };
    this.store.trackingLinks.push(link);
    this.audit("tracking_link_created", `Tracking link prepared for ${input.shipmentId} (${input.recipients.length} recipients).`);
    return this.respond(link);
  }

  async updateTrackingLink(token: string, preferences: TrackingPreferences): Promise<TrackingLink> {
    this.guardMutation();
    const link = this.store.trackingLinks.find((item) => item.token === token);
    if (!link) throw new TmsFlowExpiredLinkError("Tracking link not found.");
    link.preferences = clone(preferences);
    return this.respond(link);
  }

  async getLiveTracking(token: string, now: string, options?: GatewayOptions): Promise<LiveTrackingView> {
    const link = this.store.trackingLinks.find((item) => item.token === token);
    if (!link) throw new TmsFlowExpiredLinkError("This tracking link is invalid or has expired.");
    if (options?.scenario === "expired-link") {
      throw new TmsFlowExpiredLinkError("This tracking link has expired.");
    }
    if (new Date(now).getTime() > new Date(link.expiresAt).getTime()) {
      throw new TmsFlowExpiredLinkError("This tracking link has expired.");
    }

    const shipment = this.store.shipments.find((item) => item.id === link.shipmentId);
    if (!shipment) throw new TmsFlowExpiredLinkError("This tracking link is invalid or has expired.");
    const driver = shipment.driverId ? this.store.drivers.find((item) => item.id === shipment.driverId) : undefined;
    const vehicle = shipment.vehicleId ? this.store.vehicles.find((item) => item.id === shipment.vehicleId) : undefined;
    const preferences = link.preferences;
    const safeDriver = driver && preferences.driverName
      ? { ...driver, ...(preferences.driverPhone ? {} : { phone: "" }) }
      : undefined;

    const view: LiveTrackingView = {
      token,
      shipment: clone(shipment),
      progressMiles: 50,
      totalMiles: 81,
      eta: shipment.currentEta,
      updatedSecondsAgo: 4,
      stale: false,
      preferences,
      ...(safeDriver ? { driver: safeDriver } : {}),
      ...(vehicle ? { vehicle } : {}),
      speedMph: 38,
      speedChangePercent: -24,
      ...(preferences.reefer ? { reeferTempF: 34.1, reeferSetF: 34 } : {}),
      fuelPercent: 64,
      rangeMiles: 412,
      hosRemainingMinutes: 288,
    };
    return this.respond(view);
  }

  private requireRoute(routeId: string): RoutePlan {
    const route = this.store.routes.find((item) => item.id === routeId);
    if (!route) throw new TmsFlowValidationError("Route not found.");
    return route;
  }
}

let singleton: DemoTmsFlowGateway | undefined;

/** Shared store used by the provider and by the full-screen live tracking page. */
export const getTmsFlowGateway = (): TmsFlowGateway => {
  singleton ??= new DemoTmsFlowGateway(LATENCY_MS);
  return singleton;
};

/** Isolated gateway for unit/component tests; never shares state with the app. */
export const createTmsFlowGateway = (options?: { latencyMs?: number }): TmsFlowGateway =>
  new DemoTmsFlowGateway(options?.latencyMs ?? 0);

export const resetTmsFlowGateway = (): void => {
  singleton?.reset();
};
