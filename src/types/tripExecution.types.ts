import type { ISODateTime } from "./api.types";

export type TripAssignmentType = "PRIMARY" | "SECONDARY" | "TEAM" | "RELIEF";

export interface TripDriverAssignment {
  id: string;
  tripId: string;
  driverId: string;
  driverName: string;
  assignmentType: TripAssignmentType | string;
  assignedAt: ISODateTime;
  effectiveFrom: ISODateTime;
  effectiveTo?: ISODateTime | null;
  plannedMiles?: number | null;
  actualMiles?: number | null;
  isActive: boolean;
}

export interface AssignDriverPayload {
  driverId: string;
  assignmentType?: string;
  effectiveFrom?: string;
  plannedMiles?: number;
}

export type TripStopExecutionStatus =
  | "PENDING"
  | "EN_ROUTE"
  | "ARRIVED"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "DEPARTED";

export interface TripStopExecution {
  id: string;
  tripId: string;
  loadId?: string | null;
  order: number;
  type: string;
  status: TripStopExecutionStatus | string;
  appointmentStart?: ISODateTime | null;
  appointmentEnd?: ISODateTime | null;
  arrivedAt?: ISODateTime | null;
  serviceStartedAt?: ISODateTime | null;
  serviceCompletedAt?: ISODateTime | null;
  departedAt?: ISODateTime | null;
  dwellMinutes?: number | null;
  addressCity?: string | null;
  addressState?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
