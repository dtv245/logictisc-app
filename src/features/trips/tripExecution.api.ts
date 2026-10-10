import type {
  TripAssignmentType,
  TripStopExecutionStatus,
} from "@/types/tripExecution.types";

export const TRIP_EXECUTION_ENDPOINTS = {
  drivers: (tripId: string) => `/api/trips/${encodeURIComponent(tripId)}/drivers`,
  unassign: (tripId: string, assignmentId: string) =>
    `/api/trips/${encodeURIComponent(tripId)}/drivers/${encodeURIComponent(assignmentId)}/unassign`,
  stops: (tripId: string) => `/api/trips/${encodeURIComponent(tripId)}/stops`,
  arrive: (stopId: string) => `/api/trip-stops/${encodeURIComponent(stopId)}/arrive`,
  startService: (stopId: string) => `/api/trip-stops/${encodeURIComponent(stopId)}/start-service`,
  completeService: (stopId: string) =>
    `/api/trip-stops/${encodeURIComponent(stopId)}/complete-service`,
  depart: (stopId: string) => `/api/trip-stops/${encodeURIComponent(stopId)}/depart`,
} as const;

export const TRIP_ASSIGNMENT_TYPES: TripAssignmentType[] = [
  "PRIMARY",
  "SECONDARY",
  "TEAM",
  "RELIEF",
];

export const ALLOWED_NEXT_ACTIONS: Record<
  string,
  {
    action: "arrive" | "startService" | "completeService" | "depart";
    targetStatus: TripStopExecutionStatus;
  } | null
> = {
  PENDING: { action: "arrive", targetStatus: "ARRIVED" },
  EN_ROUTE: { action: "arrive", targetStatus: "ARRIVED" },
  ARRIVED: { action: "startService", targetStatus: "SERVICE_STARTED" },
  SERVICE_STARTED: {
    action: "completeService",
    targetStatus: "SERVICE_COMPLETED",
  },
  SERVICE_COMPLETED: { action: "depart", targetStatus: "DEPARTED" },
  DEPARTED: null,
};
