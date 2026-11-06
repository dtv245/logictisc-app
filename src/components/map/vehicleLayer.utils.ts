import { isValidCoordinatePair } from "@/utils/tms-flow/mapbox";

import type { VehicleFeatureCollection, VehicleLayerItem, VehiclePosition } from "./vehicleLayer.types";

export const DEFAULT_VEHICLE_MODEL_URI = "/models/truck.glb";
const MAX_FEATURES = 5_000;

export function buildVehicleFeatureCollection(
  vehicles: VehicleLayerItem[],
  selectedId?: string,
  positions?: Map<string, VehiclePosition>,
): VehicleFeatureCollection {
  return {
    type: "FeatureCollection",
    features: vehicles
      .slice(0, MAX_FEATURES)
      .filter((vehicle) => Boolean(vehicle.id) && isValidCoordinatePair(vehicle.lat, vehicle.lng))
      .map((vehicle) => {
        const position = positions?.get(vehicle.id) ?? vehicle;
        const bearing =
          typeof vehicle.bearing === "number" && Number.isFinite(vehicle.bearing)
            ? ((vehicle.bearing % 360) + 360) % 360
            : 0;

        return {
          type: "Feature",
          id: vehicle.id,
          geometry: { type: "Point", coordinates: [position.lng, position.lat] },
          properties: {
            id: vehicle.id,
            vehicleState: vehicle.status,
            bearing,
            modelRotation: [0, 0, bearing],
            modelUri: vehicle.modelUri || DEFAULT_VEHICLE_MODEL_URI,
            selected: vehicle.id === selectedId,
            label: vehicle.label || vehicle.id,
          },
        };
      }),
  };
}
