import type { ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";

export interface NetworkVehiclePoint {
  id: string;
  plate: string;
  latitude: number;
  longitude: number;
  status: "moving" | "idle" | "delayed";
  avatarUrl?: string;
  loadReference?: string;
  delayMinutes?: number;
  roadLabel?: string;
}

export interface NetworkRouteLine {
  id: string;
  coordinates: [number, number][];
  isProposed?: boolean;
  status?: "normal" | "delayed";
}

export interface NetworkRouteMapProps {
  vehicles: readonly NetworkVehiclePoint[];
  routes: readonly NetworkRouteLine[];
  locale?: ShipmentCardLocale;
}
