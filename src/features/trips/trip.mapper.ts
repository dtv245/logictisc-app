import { toDate, toDateOrNull } from "@formatters/dateTime";
import type { TripResponse, TripStopResponse } from "@/types/trip.dto";
import type { Trip, TripStop } from "@/types/trip.types";

export function mapTripResponse(response: TripResponse): Trip {
  return {
    ...response,
    dispatchedAt: toDateOrNull(response.dispatchedAt),
    completedAt: toDateOrNull(response.completedAt),
    cancelledAt: toDateOrNull(response.cancelledAt),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}

export function mapTripStopResponse(response: TripStopResponse): TripStop {
  return {
    ...response,
    arrivedAt: toDateOrNull(response.arrivedAt),
  };
}
