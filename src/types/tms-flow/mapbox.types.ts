import type { TruckStatus } from "@/types/trucks/truck.types";

export type MapboxLngLat = [number, number];

export interface MapboxRouteEstimate {
  distanceMiles: number;
  durationMinutes: number;
  coordinates?: MapboxLngLat[];
}

export interface MapboxCoordinatePoint {
  lat: number;
  lng: number;
}

export interface MapboxDirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: MapboxLngLat[];
}

export interface MapboxRouteState {
  estimate: MapboxRouteEstimate | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  routeCoordinates: MapboxLngLat[];
  isLoading: boolean;
  isError: boolean;
  isFallbackStraightLine: boolean;
}

export type DispatchMapVehicleStatus = TruckStatus | "signal_lost" | "unknown";

export interface DispatchMapVehicleInput {
  id: string;
  number: string;
  licensePlate?: string | null;
  mainDriverName?: string | null;
  status?: string | null;
  currentLocationLatitude?: number | null;
  currentLocationLongitude?: number | null;
  heading?: number | null;
  bearing?: number | null;
  speedKmh?: number | null;
  locationUpdatedAt?: string | null;
  updatedAt?: string | null;
}

export interface DispatchMapVehiclePoint {
  id: string;
  truckNumber: string;
  licensePlate: string;
  driverName: string | null;
  lat: number;
  lng: number;
  rawStatus: string | null;
  displayStatus: DispatchMapVehicleStatus;
  heading: number | null;
  speedKmh: number | null;
  updatedAt: string | null;
  isAssignedToSelectedLoad: boolean;
}

export interface DispatchMapStopInfo {
  kind: "pickup" | "delivery";
  badge: "A" | "B";
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hasValidCoordinates: boolean;
}

export interface MapboxBoundsBox {
  west: number;
  south: number;
  east: number;
  north: number;
}
