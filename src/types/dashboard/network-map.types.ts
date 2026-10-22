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

export interface NetworkMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind: "origin" | "destination" | "truck";
}

export interface NetworkRouteMapProps {
  vehicles: readonly NetworkVehiclePoint[];
  routes: readonly NetworkRouteLine[];
  /** Optional points such as a load's pickup/delivery or the assigned truck. */
  markers?: readonly NetworkMapMarker[];
  locale?: ShipmentCardLocale;
}
