/**
 * Chứa các kiểu dữ liệu xe tải và lịch sử bảo trì.
 */

import type {
  AuditableEntity,
} from "./common.types";
import type { Employee } from "./employee.types";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TruckType = string;

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TruckStatus = string;

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
/** Flat TruckView projection from the verified handoff; UI presentation does not add wire fields. */
export interface Truck {
  adrEquipmentAllowedClasses?: string | null;
  adrEquipmentIsAdrCertified?: boolean | null;
  currentLocationLatitude?: number | null;
  currentLocationLongitude?: number | null;
  id: string;
  isHazmatPlacarded: boolean;
  licensePlate?: string | null;
  licensePlateState?: string | null;
  mainDriverId?: string | null;
  mainDriverName?: string | null;
  make?: string | null;
  model?: string | null;
  number: string;
  secondaryDriverId?: string | null;
  secondaryDriverName?: string | null;
  status: string;
  type: string;
  vehicleCapacity: number;
  version?: number | null;
  vin?: string | null;
  year?: number | null;
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

export type { CreateTruckRequest, UpdateTruckRequest } from "./handoff.generated";
