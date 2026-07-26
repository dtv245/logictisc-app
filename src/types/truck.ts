/**
 * Chứa các kiểu dữ liệu xe tải và lịch sử bảo trì.
 */

import type {
  AuditableEntity,
  GeoLocation,
  OptionalAddress,
} from "./common";
import type { Employee } from "./employee";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TruckType =
  | "box_truck"
  | "dry_van"
  | "flatbed"
  | "reefer"
  | "tractor";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TruckStatus =
  | "available"
  | "assigned"
  | "in_transit"
  | "maintenance"
  | "out_of_service";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type MaintenanceType =
  | "inspection"
  | "oil_change"
  | "preventive"
  | "repair"
  | "tire_service";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type MaintenanceIntervalType = "mileage" | "days" | "engine_hours";

/** Xe tải được tenant quản lý và phân công vận chuyển. */
export interface Truck {
  id: string;
  number: string;
  type: TruckType;
  vehicleCapacity: number;
  status: TruckStatus;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  licensePlate?: string | null;
  licensePlateState?: string | null;
  isHazmatPlacarded: boolean;
  mainDriverId?: string | null;
  secondaryDriverId?: string | null;
  adrEquipmentAdrCertExpiresAt?: string | null;
  /** Các lớp hàng nguy hiểm ADR, theo định dạng chuỗi do backend cung cấp. */
  adrEquipmentAllowedClasses: string;
  adrEquipmentIsAdrCertified: boolean;
  adrEquipmentOrangePlateNumber?: string | null;
  currentAddress?: OptionalAddress | null;
  currentLocation?: GeoLocation | null;
}

/** Quy tắc xác định thời điểm bảo trì tiếp theo của xe tải. */
export interface MaintenanceSchedule extends AuditableEntity {
  id: string;
  truckId: string;
  maintenanceType: MaintenanceType;
  intervalType: MaintenanceIntervalType;
  mileageInterval?: number | null;
  daysInterval?: number | null;
  engineHoursInterval?: number | null;
  lastServiceMileage?: number | null;
  lastServiceDate?: string | null;
  lastServiceEngineHours?: number | null;
  nextDueMileage?: number | null;
  nextDueDate?: string | null;
  nextDueEngineHours?: number | null;
  isActive: boolean;
  notes?: string | null;
}

/** Một lần bảo trì hoặc sửa chữa đã thực hiện cho xe tải. */
export interface MaintenanceRecord extends AuditableEntity {
  id: string;
  truckId: string;
  maintenanceScheduleId?: string | null;
  maintenanceType: MaintenanceType;
  serviceDate: string;
  odometerReading: number;
  engineHours?: number | null;
  vendorName?: string | null;
  vendorAddress?: string | null;
  invoiceNumber?: string | null;
  /** Chi phí nhân công; schema không có cột currency đi kèm. */
  laborCost: number;
  /** Chi phí linh kiện; schema không có cột currency đi kèm. */
  partsCost: number;
  /** Tổng chi phí; schema không có cột currency đi kèm. */
  totalCost: number;
  description?: string | null;
  workPerformed?: string | null;
  performedById?: string | null;
}

/** Linh kiện được sử dụng trong một lần bảo trì. */
export interface MaintenancePart {
  id: string;
  maintenanceRecordId: string;
  partName: string;
  partNumber?: string | null;
  quantity: number;
  /** Đơn giá; schema không có cột currency đi kèm. */
  unitCost: number;
  /** Thành tiền; schema không có cột currency đi kèm. */
  totalCost: number;
}

/** Xe tải kèm tài xế chính và tài xế phụ. */
export interface TruckWithRelations extends Truck {
  mainDriver?: Employee | null;
  secondaryDriver?: Employee | null;
}

/** Bản ghi bảo trì kèm xe, lịch bảo trì, người thực hiện và linh kiện. */
export interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  truck?: Truck;
  maintenanceSchedule?: MaintenanceSchedule | null;
  performedBy?: Employee | null;
  parts?: MaintenancePart[];
}
