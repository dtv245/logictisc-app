import type { DeliveryPoint, DeliveryZone } from "@/types/map/map.types";

/** No delivery-point/zone contract is available; never synthesize operational records. */
export function useDeliveryPoints() {
  return { points: [] as DeliveryPoint[], zones: [] as DeliveryZone[], isLoading: false, totalCount: 0 };
}
