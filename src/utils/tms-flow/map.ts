/** Real map points for the TMS screens: load endpoints and truck positions. */

import type { TruckResponse } from "@/types/truck.dto";
import type { TmsMapMarker, TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import type { NetworkVehiclePoint } from "@/types/dashboard/network-map.types";

export const toShipmentMarkers = (
  shipment: TmsShipmentView | undefined,
): TmsMapMarker[] => {
  if (!shipment) return [];
  const markers: TmsMapMarker[] = [];
  if (shipment.originLatitude != null && shipment.originLongitude != null) {
    markers.push({
      id: `${shipment.id}-origin`,
      latitude: shipment.originLatitude,
      longitude: shipment.originLongitude,
      label: `Pickup · ${shipment.originCity}`,
      kind: "origin",
    });
  }
  if (shipment.destinationLatitude != null && shipment.destinationLongitude != null) {
    markers.push({
      id: `${shipment.id}-destination`,
      latitude: shipment.destinationLatitude,
      longitude: shipment.destinationLongitude,
      label: `Delivery · ${shipment.destinationCity}`,
      kind: "destination",
    });
  }
  return markers;
};

export const toTruckMarker = (
  truck: TruckResponse | undefined,
): TmsMapMarker | undefined =>
  truck?.currentLocationLatitude != null && truck.currentLocationLongitude != null
    ? {
        id: `truck-${truck.id}`,
        latitude: truck.currentLocationLatitude,
        longitude: truck.currentLocationLongitude,
        label: `${truck.number} · ${truck.mainDriverName ?? "No driver"}`,
        kind: "truck",
      }
    : undefined;

export const toTruckMarkers = (
  trucks: readonly TruckResponse[],
): TmsMapMarker[] =>
  trucks.flatMap((truck) => {
    const marker = toTruckMarker(truck);
    return marker ? [marker] : [];
  });

export const toNetworkVehicles = (
  trucks: readonly TruckResponse[],
): NetworkVehiclePoint[] =>
  trucks.flatMap((truck) => {
    if (truck.currentLocationLatitude == null || truck.currentLocationLongitude == null) {
      return [];
    }
    return [
      {
        id: truck.id,
        plate: truck.number,
        latitude: truck.currentLocationLatitude,
        longitude: truck.currentLocationLongitude,
        status: truck.status === "in_use" ? "moving" : "idle",
        loadReference: truck.mainDriverName ?? undefined,
      },
    ];
  });
