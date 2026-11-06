import type { LucideIcon } from "lucide-react";

/**
 * Toạ độ chuẩn toạ độ địa lý: [longitude, latitude] (kinh độ, vĩ độ).
 * LƯU Ý: Luôn dùng [lng, lat] cho MapLibre, GeoJSON và deck.gl.
 */
export type LngLat = [number, number];

export type DeliveryStatus = "pending" | "in_transit" | "delivered" | "failed";

export type VehicleType = "motorbike" | "van" | "truck_1t";

export interface VehicleConfig {
  type: VehicleType;
  label: string;
  maxWeightKg: number;
  color: [number, number, number];
  hex: string;
  icon: LucideIcon;
}

export interface DeliveryPoint {
  id: string;
  orderCode: string;
  customerName: string;
  phoneNumber?: string;
  address: string;
  coordinates: LngLat;
  status: DeliveryStatus;
  weightKg: number;
  vehicleType: VehicleType;
  zoneId?: string | null;
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  code: string;
  polygon: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: {
      type: "Polygon";
      coordinates: LngLat[][];
    };
  };
  color?: [number, number, number];
}

export interface RouteData {
  id: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  driverName: string;
  coordinates: LngLat[];
  distanceKm: number;
  durationMinutes: number;
  encodedPolyline?: string;
  color: [number, number, number];
}

export interface GeocodingResult {
  id: string;
  name: string;
  formattedAddress: string;
  coordinates: LngLat;
  postalCode?: string;
  type?: string;
}

export interface H3Cluster {
  hex: string;
  count: number;
  boundary: LngLat[];
  color: [number, number, number, number];
}
