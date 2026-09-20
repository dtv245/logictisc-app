import type { Address, GeoLocation, Money } from "./common.types";
import type { ISODateTime } from "./api.types";

export type LoadType = "container" | "dry_van" | "flatbed" | "reefer" | "vehicle";
export type LoadStatus = "draft" | "pending" | "dispatched" | "picked_up" | "in_transit" | "delivered" | "cancelled";
export type LoadSource = "manual" | "customer_portal" | "load_board" | "api";
export type ExternalLoadProviderType = "dat" | "truckstop" | "123loadboard" | "other";
export type HazmatClass = "class_1" | "class_2" | "class_3" | "class_4" | "class_5" | "class_6" | "class_7" | "class_8" | "class_9";
export type LoadConditionReportType = "pickup" | "delivery" | "return";
export type LoadExceptionType = "delay" | "damage" | "delivery_failure" | "missing_cargo" | "other";
export type ConditionDefectSeverity = "minor" | "major" | "critical";
export type ConditionDefectPartCategory = "body" | "cargo" | "container" | "glass" | "interior" | "seal" | "tires" | "wheels" | "other";

export interface LoadResponse {
  id: string;
  number: number;
  name: string;
  type: LoadType;
  status: LoadStatus;
  distance: number;
  isInProximity: boolean;
  dispatchedAt?: ISODateTime | null;
  pickedUpAt?: ISODateTime | null;
  deliveredAt?: ISODateTime | null;
  cancelledAt?: ISODateTime | null;
  customerId: string;
  customerName?: string;
  assignedTruckId?: string | null;
  assignedTruckNumber?: string | null;
  assignedDispatcherId?: string | null;
  assignedDispatcherName?: string | null;
  source: LoadSource;
  requestedPickupDate?: ISODateTime | null;
  requestedDeliveryDate?: ISODateTime | null;
  notes?: string | null;
  isHazmat: boolean;
  hazmatClass?: HazmatClass | null;
  unNumber?: string | null;
  containerId?: string | null;
  originTerminalId?: string | null;
  destinationTerminalId?: string | null;
  externalSourceProvider?: ExternalLoadProviderType | null;
  externalSourceId?: string | null;
  externalBrokerReference?: string | null;
  deliveryCost: Money;
  destinationAddress: Address;
  destinationLocation: GeoLocation;
  originAddress: Address;
  originLocation: GeoLocation;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
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
