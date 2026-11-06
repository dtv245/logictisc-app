import type { AuditableEntity } from "@/types/common.types";
import type { Employee } from "@/types/employees/employee.types";
import type { Truck } from "@/types/trucks/truck.types";

export type MaintenanceType =
  | "inspection"
  | "oil_change"
  | "preventive"
  | "repair"
  | "tire_service";

export type MaintenanceIntervalType = "mileage" | "days" | "engine_hours";

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
  nextDueDate?: string | null;
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

/** Bản ghi bảo trì kèm xe, lịch bảo trì, người thực hiện và linh kiện. */
export interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  truck?: Truck;
  maintenanceSchedule?: MaintenanceSchedule | null;
  performedBy?: Employee | null;
  parts?: MaintenancePart[];
}
