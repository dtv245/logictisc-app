import type { TripResponse, TripStopResponse } from "@/types/trip.dto";
import type { Trip, TripStop } from "@/types/trip.types";

export function mapTripResponse(response: TripResponse): Trip {
  return {
    ...response,
    dispatchedAt: response.dispatchedAt ? new Date(response.dispatchedAt) : null,
    completedAt: response.completedAt ? new Date(response.completedAt) : null,
    cancelledAt: response.cancelledAt ? new Date(response.cancelledAt) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}

export function mapTripStopResponse(response: TripStopResponse): TripStop {
  return {
    ...response,
    arrivedAt: response.arrivedAt ? new Date(response.arrivedAt) : null,
  };
}
