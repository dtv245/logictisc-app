/**
 * Chứa các kiểu dữ liệu chuyến hàng, container, terminal và kiểm tra tình trạng.
 */

import type {
  Address,
  AuditableEntity,
  GeoLocation,
  Money,
} from "./common";
import type { Customer } from "./customer";
import type { Employee } from "./employee";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TerminalType = "port" | "rail" | "warehouse" | "yard";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ContainerIsoType =
  | "20GP"
  | "20HC"
  | "40GP"
  | "40HC"
  | "45HC";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ContainerStatus =
  | "available"
  | "booked"
  | "in_transit"
  | "delivered"
  | "returned";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadType =
  | "container"
  | "dry_van"
  | "flatbed"
  | "reefer"
  | "vehicle";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadStatus =
  | "draft"
  | "pending"
  | "dispatched"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadSource = "manual" | "customer_portal" | "load_board" | "api";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ExternalLoadProviderType =
  | "dat"
  | "truckstop"
  | "123loadboard"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type HazmatClass =
  | "class_1"
  | "class_2"
  | "class_3"
  | "class_4"
  | "class_5"
  | "class_6"
  | "class_7"
  | "class_8"
  | "class_9";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadConditionReportType = "pickup" | "delivery" | "return";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadExceptionType =
  | "delay"
  | "damage"
  | "delivery_failure"
  | "missing_cargo"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ConditionDefectSeverity = "minor" | "major" | "critical";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type ConditionDefectPartCategory =
  | "body"
  | "cargo"
  | "container"
  | "glass"
  | "interior"
  | "seal"
  | "tires"
  | "wheels"
  | "other";

/** Terminal cảng, rail yard, kho hoặc bãi được dùng trong vận chuyển. */
export interface Terminal extends AuditableEntity {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  type: TerminalType;
  notes?: string | null;
  address: Address;
}

/** Container hàng hóa được theo dõi trong hệ thống. */
export interface Container extends AuditableEntity {
  id: string;
  number: string;
  isoType: ContainerIsoType;
  sealNumber?: string | null;
  bookingReference?: string | null;
  billOfLadingNumber?: string | null;
  isLaden: boolean;
  grossWeight: number;
  status: ContainerStatus;
  currentTerminalId?: string | null;
  notes?: string | null;
  loadedAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
}

/** Chuyến hàng cần được điều phối từ điểm lấy đến điểm giao. */
export interface Load extends AuditableEntity {
  id: string;
  number: number;
  name: string;
  type: LoadType;
  status: LoadStatus;
  distance: number;
  isInProximity: boolean;
  dispatchedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  customerId: string;
  assignedTruckId?: string | null;
  assignedDispatcherId?: string | null;
  source: LoadSource;
  requestedPickupDate?: string | null;
  requestedDeliveryDate?: string | null;
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
}

/** Ngoại lệ phát sinh trong quá trình xử lý chuyến hàng. */
export interface LoadException extends AuditableEntity {
  id: string;
  loadId: string;
  type: LoadExceptionType;
  reason: string;
  occurredAt: string;
  resolvedAt?: string | null;
  reportedById: string;
  reportedByName: string;
  resolution?: string | null;
}

/** Biên bản kiểm tra tình trạng hàng, xe hoặc container. */
export interface LoadConditionReport extends AuditableEntity {
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
  inspectedAt: string;
  inspectedById: string;
}

/** Khiếm khuyết được ghi nhận trong biên bản tình trạng chuyến hàng. */
export interface ConditionDefect {
  id: string;
  loadConditionReportId: string;
  partCategory: ConditionDefectPartCategory;
  description: string;
  severity: ConditionDefectSeverity;
}

/** Chuyến hàng kèm các quan hệ thường được dùng trên màn hình chi tiết. */
export interface LoadWithRelations extends Load {
  customer?: Customer;
  assignedTruck?: Truck | null;
  assignedDispatcher?: Employee | null;
  container?: Container | null;
  originTerminal?: Terminal | null;
  destinationTerminal?: Terminal | null;
  exceptions?: LoadException[];
  conditionReports?: LoadConditionReport[];
}

/** Container kèm terminal hiện tại. */
export interface ContainerWithRelations extends Container {
  currentTerminal?: Terminal | null;
}

/** Biên bản tình trạng kèm danh sách khiếm khuyết và người kiểm tra. */
export interface LoadConditionReportWithRelations
  extends LoadConditionReport {
  defects?: ConditionDefect[];
  inspectedBy?: Employee;
}
