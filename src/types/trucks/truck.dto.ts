import type { TruckStatus, TruckType } from "./truck.types";

export type { TruckStatus, TruckType };

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Truck (`TruckResponse.java`).
 */
export interface TruckResponse {
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
  mainDriverName?: string | null;
  secondaryDriverId?: string | null;
  secondaryDriverName?: string | null;
  adrEquipmentIsAdrCertified: boolean;
  adrEquipmentAllowedClasses?: string | null;
  currentLocationLatitude?: number | null;
  currentLocationLongitude?: number | null;
}

/**
 * Payload gửi lên API để tạo mới Truck (`CreateTruckRequest.java`).
 */
export interface CreateTruckRequest {
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
  adrEquipmentIsAdrCertified?: boolean;
  adrEquipmentAllowedClasses?: string | null;
  adrEquipmentOrangePlateNumber?: string | null;
}

/**
 * Payload gửi lên API để cập nhật Truck (`PUT /api/trucks/{id}`).
 */
export type UpdateTruckRequest = Partial<CreateTruckRequest>;
