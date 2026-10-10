import type { GeoLocation } from "./common.types";
import type { ISODateTime } from "./api.types";

export type LoadType = string;
/** CORE status/type are open strings in the verified transport schema. Consequential transitions use explicit known states. */
export type LoadStatus = string;
export type LoadSource = string;
export type ExternalLoadProviderType = string;
export type HazmatClass = string;
export type LoadConditionReportType = "pickup" | "delivery" | "return";
export type LoadExceptionType = "delay" | "damage" | "delivery_failure" | "missing_cargo" | "other";
export type ConditionDefectSeverity = "minor" | "major" | "critical";
export type ConditionDefectPartCategory = "body" | "cargo" | "container" | "glass" | "interior" | "seal" | "tires" | "wheels" | "other";

/** Flat LoadView projection from the verified handoff; UI presentation does not add wire fields. */
export interface LoadResponse {
  assignedDispatcherId?: string | null;
  assignedDispatcherName?: string | null;
  assignedTruckId?: string | null;
  assignedTruckNumber?: string | null;
  cancelledAt?: string | null;
  customerId: string;
  customerName?: string | null;
  deliveredAt?: string | null;
  deliveryCostAmount?: number | null;
  deliveryCostCurrency?: string | null;
  destinationAddressCity?: string | null;
  destinationAddressCountry?: string | null;
  destinationAddressLine1?: string | null;
  destinationAddressLine2?: string | null;
  destinationAddressState?: string | null;
  destinationAddressZipCode?: string | null;
  destinationLocationLatitude?: number | null;
  destinationLocationLongitude?: number | null;
  dispatchedAt?: string | null;
  distance: number;
  hazmatClass?: string | null;
  id: string;
  isHazmat: boolean;
  isInProximity: boolean;
  name: string;
  notes?: string | null;
  number: number;
  originAddressCity?: string | null;
  originAddressCountry?: string | null;
  originAddressLine1?: string | null;
  originAddressLine2?: string | null;
  originAddressState?: string | null;
  originAddressZipCode?: string | null;
  originLocationLatitude?: number | null;
  originLocationLongitude?: number | null;
  pickedUpAt?: string | null;
  pickupBusinessDateChangeId?: string | null;
  requestedDeliveryDate?: string | null;
  requestedPickupBusinessDate?: string | null;
  requestedPickupDate?: string | null;
  source: string;
  status: string;
  type: string;
  unNumber?: string | null;
  version?: number | null;
}

export interface LoadExceptionResponse {
  id: string;
  loadId: string;
  type: LoadExceptionType;
  reason: string;
  occurredAt: ISODateTime;
  resolvedAt?: ISODateTime | null;
  reportedById: string;
  reportedByName: string;
  resolution?: string | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface ConditionDefectResponse {
  id: string;
  loadConditionReportId: string;
  partCategory: ConditionDefectPartCategory;
  description: string;
  severity: ConditionDefectSeverity;
}

export interface LoadConditionReportResponse {
  id: string;
  loadId: string;
  type: LoadConditionReportType;
  vin?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleBodyClass?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  notes?: string | null;
  inspectorSignature?: string | null;
  location?: GeoLocation | null;
  inspectedAt: ISODateTime;
  inspectedById: string;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export type { CreateLoadRequest, UpdateLoadRequest, SetPickupBusinessDateRequest } from "./handoff.generated";
