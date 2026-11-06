/**
 * Chứa các kiểu dữ liệu xe tải và lịch sử bảo trì.
 */

import type { Employee } from "@/types/employee.types";
import type {
  MaintenanceIntervalType,
  MaintenancePart,
  MaintenanceRecord,
  MaintenanceRecordWithRelations,
  MaintenanceSchedule,
  MaintenanceType,
} from "@/types/maintenance/maintenance.types";

export type {
  MaintenanceIntervalType,
  MaintenancePart,
  MaintenanceRecord,
  MaintenanceRecordWithRelations,
  MaintenanceSchedule,
  MaintenanceType,
};

export type TruckType =
  | "SEMI_TRUCK"
  | "FLATBED"
  | "BOX_TRUCK"
  | "TANKER"
  | "REEFER";

export type TruckStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "out_of_service";

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

/** Xe tải kèm tài xế chính và tài xế phụ. */
export interface TruckWithRelations extends Truck {
  mainDriver?: Employee | null;
  secondaryDriver?: Employee | null;
}

export type { CreateTruckRequest, UpdateTruckRequest } from "@/types/handoff.generated";
