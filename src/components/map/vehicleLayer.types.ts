export type VehicleLayerStatus = "moving" | "idle" | "unknown";

export interface VehicleLayerItem {
  id: string;
  lng: number;
  lat: number;
  bearing?: number | null;
  status: VehicleLayerStatus;
  modelUri?: string;
  label?: string;
}

export interface VehiclePosition {
  lng: number;
  lat: number;
}

export interface VehicleFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      id: string;
      vehicleState: VehicleLayerStatus;
      bearing: number;
      modelRotation: [number, number, number];
      modelUri: string;
      selected: boolean;
      label: string;
    };
  }>;
}
