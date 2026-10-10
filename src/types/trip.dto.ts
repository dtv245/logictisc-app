import type { Address, GeoLocation } from "./common.types";
import type { ISODateTime } from "./api.types";

/** Open CORE vocabulary follows the verified schema; commands still reject unknown state. */
export type TripStatus = string;
export type TripStopType = "pickup" | "delivery" | "break" | "terminal";

/** Flat TripView projection from the verified handoff; UI presentation does not add wire fields. */
export interface TripResponse {
  cancelledAt?: string | null;
  completedAt?: string | null;
  dispatchedAt?: string | null;
  id: string;
  name: string;
  number: number;
  status: string;
  totalDistance: number;
  truckId?: string | null;
  truckNumber?: string | null;
  version?: number | null;
}

export interface TripStopResponse {
  id: string;
  type: TripStopType;
  tripId: string;
  order: number;
  arrivedAt?: ISODateTime | null;
  loadId: string;
  address: Address;
  location: GeoLocation;
}

export type { CreateTripRequest, UpdateTripRequest } from "./handoff.generated";
