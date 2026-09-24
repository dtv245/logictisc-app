import type { BaseRecord } from "@refinedev/core";

export interface OperationsTruckRecord extends BaseRecord {
  id: string;
  licensePlate?: string | null;
  number: string;
  status: string;
  currentLocationLatitude?: number | null;
  currentLocationLongitude?: number | null;
}

export interface VehicleMapPoint {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  status: string;
}

const isLatitude = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;

const isLongitude = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;

/** Chỉ đưa tọa độ hợp lệ từ API lên bản đồ; tuyệt đối không tạo vị trí thay thế. */
export const toVehicleMapPoints = (
  trucks: readonly OperationsTruckRecord[],
): VehicleMapPoint[] =>
  trucks.flatMap((truck) => {
    const latitude = truck.currentLocationLatitude;
    const longitude = truck.currentLocationLongitude;

    if (!isLatitude(latitude) || !isLongitude(longitude)) {
      return [];
    }

    return [
      {
        id: truck.id,
        label: truck.licensePlate?.trim() || truck.number,
        latitude,
        longitude,
        status: truck.status,
      },
    ];
  });

