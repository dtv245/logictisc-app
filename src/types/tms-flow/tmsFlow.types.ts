/**
 * TMS operations flow — pure domain types for the fixture-backed `/tms` demo.
 *
 * No resource configuration, endpoints or constants belong here.
 */

export type IsoDateTime = string;

export interface TimeWindow {
  start: IsoDateTime;
  end: IsoDateTime;
}

export type ShipmentStatus =
  | "booked"
  | "assigned"
  | "in_transit"
  | "at_risk"
  | "delayed"
  | "delivered";

export type ShipmentPriority = "standard" | "priority" | "critical";

export interface Shipment {
  id: string;
  customer: string;
  contactName: string;
  po: string;
  origin: string;
  destination: string;
  pickup: TimeWindow;
  delivery: TimeWindow;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  pallets: number;
  weightLb: number;
  equipment: string;
  driverId?: string;
  vehicleId?: string;
  routeId?: string;
  currentEta: IsoDateTime;
  proposedEta?: IsoDateTime;
  receivingCloses?: IsoDateTime;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  homeTerminal: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  driverId: string;
  truck: string;
}

export interface RouteStop {
  id: string;
  name: string;
  city: string;
  kind: "pickup" | "delivery";
  window: TimeWindow;
  completed?: boolean;
  note?: string;
}

export interface RouteMetrics {
  miles: number;
  driveMinutes: number;
  costUsd: number;
  windowsMet: number;
  windowsTotal: number;
  co2Kg: number;
}

export interface RoutePlan {
  id: string;
  name: string;
  driverId: string;
  stops: RouteStop[];
  current: RouteMetrics;
  optimized: RouteMetrics;
  mode: "current" | "optimized";
  coordinates: [number, number][];
}

export type ApprovalState =
  | "pending_approval"
  | "under_review"
  | "approved"
  | "applied"
  | "rejected";

export interface RouteApproval {
  id: string;
  shipmentId: string;
  state: ApprovalState;
  currentRoute: string;
  proposedRoute: string;
  currentEta: IsoDateTime;
  proposedEta: IsoDateTime;
  currentMiles: number;
  proposedMiles: number;
  savedMinutes: number;
  fuelDeltaUsd: number;
  hosRemainingMinutes: number;
  requestedBy: string;
  reason: string;
}

export interface AuditEvent {
  id: string;
  at: IsoDateTime;
  actor: string;
  action: string;
  detail: string;
}

export type MessageChannel = "email" | "sms" | "internal";

export interface Message {
  id: string;
  threadId: string;
  from: string;
  to: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  at: IsoDateTime;
}

export interface MessageThread {
  id: string;
  contactName: string;
  customer: string;
  shipmentId?: string;
  channel: MessageChannel;
  unread: boolean;
  lastMessageAt: IsoDateTime;
  messages: Message[];
  suggestedReplies: string[];
}

export interface MessageDraft {
  threadId?: string;
  to: string;
  channel: MessageChannel;
  subject: string;
  body: string;
  shipmentId?: string;
}

export interface TrackingPreferences {
  liveMap: boolean;
  eta: boolean;
  reefer: boolean;
  driverName: boolean;
  driverPhone: boolean;
}

export interface TrackingRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface TrackingLink {
  token: string;
  shipmentId: string;
  recipients: TrackingRecipient[];
  preferences: TrackingPreferences;
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

export interface LiveTrackingView {
  token: string;
  shipment: Shipment;
  driver?: Driver;
  vehicle?: Vehicle;
  speedMph?: number;
  speedChangePercent?: number;
  reeferTempF?: number;
  reeferSetF?: number;
  fuelPercent?: number;
  rangeMiles?: number;
  hosRemainingMinutes?: number;
  progressMiles: number;
  totalMiles: number;
  eta: IsoDateTime;
  updatedSecondsAgo: number;
  stale: boolean;
  preferences: TrackingPreferences;
}

export interface AutoAssignCandidate {
  loadId: string;
  driverId: string;
  driverName: string;
  matchPercent: number;
  ready: boolean;
  reason?: string;
}

export interface AutoAssignResult {
  candidates: AutoAssignCandidate[];
  assignedCount: number;
  skippedCount: number;
}

export type DispatchFilter = "all" | "at-risk" | "priority" | "approvals";

export interface MapVehicle {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  status: "moving" | "idle" | "delayed";
}

export interface MapRoute {
  id: string;
  coordinates: [number, number][];
  proposed?: boolean;
  status?: "normal" | "delayed";
}

export interface DashboardKpis {
  active: number;
  inTransit: number;
  deliveredToday: number;
  delayed: number;
  atRisk: number;
  exceptions: number;
}

export interface TmsFlowSnapshot {
  operatorName: string;
  kpis: DashboardKpis;
  shipments: Shipment[];
  drivers: Driver[];
  vehicles: Vehicle[];
  routes: RoutePlan[];
  approvals: RouteApproval[];
  threads: MessageThread[];
  audits: AuditEvent[];
  trackingLinks: TrackingLink[];
  mapVehicles: MapVehicle[];
  mapRoutes: MapRoute[];
}

export interface TmsFlowPermissions {
  readOnly: boolean;
  canApprove: boolean;
  canMessage: boolean;
  canShareTracking: boolean;
}

export type TmsScenario =
  | "normal"
  | "stale-approval"
  | "network-error"
  | "stale-assignment"
  | "expired-link"
  | "read-only";

export interface NewShipmentInput {
  customer: string;
  contactName: string;
  po: string;
  origin: string;
  destination: string;
  pickup: TimeWindow;
  delivery: TimeWindow;
  pallets: number;
  weightLb: number;
  equipment: string;
  assignSuggestedDriver: boolean;
  notifyCustomer: boolean;
}
