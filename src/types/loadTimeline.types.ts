import type { ISODateTime } from "./api.types";

export interface LoadEventView {
  id: string;
  loadId: string;
  tripId?: string | null;
  tripStopId?: string | null;
  eventType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  occurredAt: ISODateTime;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  actorId?: string | null;
  documentId?: string | null;
  note?: string | null;
}

export interface LoadTimelineResponse {
  loadId: string;
  loadNumber: string;
  currentStatus: string;
  events: LoadEventView[];
}
