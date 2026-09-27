import type { ISODateTime } from "./api.types";

export type LoadType = "container" | "dry_van" | "flatbed" | "reefer" | "vehicle";
/**
 * Khớp `LoadStatus` của backend (`load/core/LoadStatus.java`), lưu ở cột dạng chữ thường.
 * State machine: `draft → dispatched → picked_up → delivered`, và `cancelled` từ ba trạng thái
 * đầu. `delivered`/`cancelled` là trạng thái kết thúc.
 */
export type LoadStatus = "draft" | "dispatched" | "picked_up" | "delivered" | "cancelled";
export type LoadSource = "manual" | "customer_portal" | "load_board" | "api";
export type ExternalLoadProviderType = "dat" | "truckstop" | "123loadboard" | "other";
export type HazmatClass = "class_1" | "class_2" | "class_3" | "class_4" | "class_5" | "class_6" | "class_7" | "class_8" | "class_9";
export type LoadConditionReportType = "pickup" | "delivery" | "return";
export type LoadExceptionType = "delay" | "damage" | "delivery_failure" | "missing_cargo" | "other";
export type ConditionDefectSeverity = "minor" | "major" | "critical";
export type ConditionDefectPartCategory = "body" | "cargo" | "container" | "glass" | "interior" | "seal" | "tires" | "wheels" | "other";

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend trả về (`LoadResponse.java`).
 * Tuyệt đối tôn trọng cấu trúc JSON của Backend ở file này:
 * - deliveryCostAmount và deliveryCostCurrency là trường phẳng.
 * - origin/destination address và location là các trường phẳng.
 * - Backend không trả audit fields.
 */
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
  customerName?: string | null;
  assignedTruckId?: string | null;
  assignedTruckNumber?: string | null;
  assignedDispatcherId?: string | null;
  assignedDispatcherName?: string | null;
  containerId?: string | null;
  originTerminalId?: string | null;
  destinationTerminalId?: string | null;
  source: LoadSource;
  requestedPickupDate?: ISODateTime | null;
  requestedDeliveryDate?: ISODateTime | null;
  notes?: string | null;
  isHazmat: boolean;
  hazmatClass?: HazmatClass | string | null;
  unNumber?: string | null;
  deliveryCostAmount: number;
  deliveryCostCurrency: string;
  originAddressLine1: string;
  originAddressLine2?: string | null;
  originAddressCity: string;
  originAddressState: string;
  originAddressZipCode: string;
  originAddressCountry: string;
  originLocationLatitude: number;
  originLocationLongitude: number;
  destinationAddressLine1: string;
  destinationAddressLine2?: string | null;
  destinationAddressCity: string;
  destinationAddressState: string;
  destinationAddressZipCode: string;
  destinationAddressCountry: string;
  destinationLocationLatitude: number;
  destinationLocationLongitude: number;
}

/**
 * Payload gửi lên API để tạo mới Load (`CreateLoadRequest.java`).
 */
export interface CreateLoadRequest {
  name: string;
  type: LoadType | string;
  status: LoadStatus | string;
  distance: number;
  isInProximity: boolean;
  customerId: string;
  assignedTruckId?: string | null;
  assignedDispatcherId?: string | null;
  source: LoadSource | string;
  requestedPickupDate?: ISODateTime | null;
  requestedDeliveryDate?: ISODateTime | null;
  notes?: string | null;
  isHazmat: boolean;
  hazmatClass?: HazmatClass | string | null;
  unNumber?: string | null;
  containerId?: string | null;
  originTerminalId?: string | null;
  destinationTerminalId?: string | null;
  externalSourceProvider?: ExternalLoadProviderType | string | null;
  externalSourceId?: string | null;
  externalBrokerReference?: string | null;
  deliveryCostAmount: number;
  deliveryCostCurrency: string;
  originAddressLine1: string;
  originAddressLine2?: string | null;
  originAddressCity: string;
  originAddressState: string;
  originAddressZipCode: string;
  originAddressCountry: string;
  originLocationLatitude: number;
  originLocationLongitude: number;
  destinationAddressLine1: string;
  destinationAddressLine2?: string | null;
  destinationAddressCity: string;
  destinationAddressState: string;
  destinationAddressZipCode: string;
  destinationAddressCountry: string;
  destinationLocationLatitude: number;
  destinationLocationLongitude: number;
}

/**
 * Payload gửi lên API để cập nhật Load (`PUT /api/loads/{id}`).
 */
export type UpdateLoadRequest = Partial<CreateLoadRequest>;

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
  createdAt?: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface ConditionDefectResponse {
  id: string;
  loadConditionReportId?: string;
  partCategory: ConditionDefectPartCategory | string;
  description: string;
  severity: ConditionDefectSeverity | string;
}

export interface LoadConditionReportResponse {
  id: string;
  loadId: string;
  type: LoadConditionReportType | string;
  vin?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleBodyClass?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  notes?: string | null;
  inspectorSignature?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  inspectedAt: ISODateTime;
  inspectedById: string;
  inspectedByName?: string | null;
  defects?: ConditionDefectResponse[];
}
