/**
 * TMS operations flow — pure domain types backed by the real logistics API.
 *
 * No resource configuration, endpoints or constants belong here.
 */

import type { EmployeeResponse } from "@/types/employee.dto";
import type { LoadResponse } from "@/types/load.dto";
import type { TruckResponse } from "@/types/truck.dto";

export type TmsOperationalStatus =
  | "open"
  | "assigned"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type TmsRiskLevel = "none" | "at_risk" | "delayed";

export type TmsQueueFilter = "all" | "at-risk" | "unassigned" | "approvals";

export interface TmsOperationsSummary {
  active: number;
  inTransit: number;
  deliveredToday: number;
  delayed: number;
  atRisk: number;
  unassigned: number;
}

export interface TmsLoadCollection {
  items: LoadResponse[];
  /** True when the client stopped paginating before reaching `totalItems`. */
  truncated: boolean;
  totalItems: number;
}

/** Read model used by every TMS screen; derived from `LoadResponse`, never invented. */
export interface TmsShipmentView {
  id: string;
  number: number;
  name: string;
  customerName: string;
  rawStatus: string;
  status: TmsOperationalStatus;
  risk: TmsRiskLevel;
  originCity: string;
  destinationCity: string;
  originAddress: string;
  destinationAddress: string;
  requestedPickupDate?: string;
  requestedDeliveryDate?: string;
  dispatchedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  assignedTruckId?: string;
  assignedTruckNumber?: string;
  distance: number;
  deliveryCostAmount?: number;
  deliveryCostCurrency?: string;
  isHazmat: boolean;
  hazmatClass?: string;
  notes?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  raw: LoadResponse;
}

export interface TmsAiSuggestionMetric {
  deadheadMiles?: number | null;
  expectedMarginRatio?: number | null;
  hosRemainingHours?: number | null;
  onTimeProbability?: number | null;
  totalDistanceMiles?: number | null;
}

/** Pending AI dispatch decision as returned by `/api/ai/dispatch/pending`. */
export interface TmsAiSuggestion {
  decisionId: string;
  rank: number;
  truckId: string;
  tripId?: string | null;
  truckNumber?: string | null;
  driverId: string;
  driverName?: string | null;
  score: number | string;
  confidence: string;
  reasoning: string;
  metrics?: TmsAiSuggestionMetric;
  status: string;
}

/** Per-load AI state from `POST /api/ai/loads/overview`. */
export interface TmsAiLoadStatus {
  loadId: string;
  gapStatus: string;
  blockingGapsCount: number;
  warningGapsCount: number;
  dispatchStatus: string;
  latestSessionId?: string | null;
  latestDecisionId?: string | null;
  suggestedTruckId?: string | null;
  suggestedTruckNumber?: string | null;
  capabilities?: {
    canApprove?: boolean;
    canReject?: boolean;
    canRerun?: boolean;
    canViewRuns?: boolean;
  };
}

/** A pending suggestion joined with its load (when the overview can resolve it). */
export interface TmsApproval {
  suggestion: TmsAiSuggestion;
  load?: TmsShipmentView;
  truck?: TruckResponse;
  driver?: EmployeeResponse;
}

export interface TmsTimelineEvent {
  id: string;
  loadId: string;
  tripId?: string | null;
  tripStopId?: string | null;
  eventType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  actorId?: string | null;
  documentId?: string | null;
  note?: string | null;
}

export interface TmsLoadTimeline {
  loadId: string;
  loadNumber: string;
  currentStatus: string;
  events: TmsTimelineEvent[];
}

export interface TmsMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind: "origin" | "destination" | "truck";
}

export interface TmsTruckCollection {
  items: TruckResponse[];
  truncated: boolean;
  totalItems: number;
}

export interface TmsQueueCounts {
  all: number;
  atRisk: number;
  unassigned: number;
  approvals: number;
}
