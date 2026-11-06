import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import type { TruckResponse } from "@/types/trucks/truck.dto";
import { isValidCoordinatePair } from "@/utils/tms-flow/mapbox";

export const selectDashboardAttentionTrucks = (
  trucks: readonly TruckResponse[],
  riskLoads: readonly TmsShipmentView[],
): TruckResponse[] => {
  const riskTruckIds = new Set(riskLoads.map((load) => load.assignedTruckId).filter(Boolean));
  const riskTruckNumbers = new Set(
    riskLoads.map((load) => load.assignedTruckNumber?.trim().toLowerCase()).filter(Boolean),
  );
  return trucks.filter((truck) =>
    riskTruckIds.has(truck.id) ||
    riskTruckNumbers.has(truck.number.trim().toLowerCase()) ||
    (truck.licensePlate && riskTruckNumbers.has(truck.licensePlate.trim().toLowerCase())) ||
    !isValidCoordinatePair(truck.currentLocationLatitude, truck.currentLocationLongitude),
  );
};
