/**
 * Gateway seam for the TMS operations flow.
 *
 * Screens depend on this interface only. The demo implementation is fixture
 * backed; a future backend adapter replaces it without touching the UI.
 */

import type {
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
  TrackingRecipient,
} from "@/types/tms-flow/tmsFlow.types";

export class TmsFlowConflictError extends Error {
  readonly code = "TMS_FLOW_CONFLICT";
}

export class TmsFlowValidationError extends Error {
  readonly code = "TMS_FLOW_VALIDATION";
}

export class TmsFlowExpiredLinkError extends Error {
  readonly code = "TMS_FLOW_EXPIRED_LINK";
}

export class TmsFlowPermissionError extends Error {
  readonly code = "TMS_FLOW_PERMISSION";
}

export interface GatewayOptions {
  scenario?: TmsScenario;
  readOnly?: boolean;
}

export interface CreateTrackingInput {
  shipmentId: string;
  recipients: TrackingRecipient[];
  preferences: TrackingPreferences;
}

export type RouteDecision = "approve" | "reject";

export interface TmsFlowGateway {
  /** Applies URL-driven demo switches before a screen performs actions. */
  configure(options: GatewayOptions): void;
  loadSnapshot(): Promise<TmsFlowSnapshot>;
  createShipment(input: NewShipmentInput): Promise<{ shipmentId: string }>;
  autoAssign(loadIds: string[]): Promise<AutoAssignResult>;
  applyOptimizedRoute(routeId: string): Promise<RoutePlan>;
  saveRouteStops(routeId: string, stops: RouteStop[]): Promise<RoutePlan>;
  decideRouteChange(approvalId: string, decision: RouteDecision, reason?: string): Promise<RouteApproval>;
  sendMessage(draft: MessageDraft): Promise<Message>;
  createTrackingLink(input: CreateTrackingInput): Promise<TrackingLink>;
  updateTrackingLink(token: string, preferences: TrackingPreferences): Promise<TrackingLink>;
  getLiveTracking(token: string, now: string, options?: GatewayOptions): Promise<LiveTrackingView>;
  reset(): void;
}

export const DEFAULT_TRACKING_PREFERENCES: TrackingPreferences = {
  liveMap: true,
  eta: true,
  reefer: false,
  driverName: false,
  driverPhone: false,
};
