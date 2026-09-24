import type { Address, GeoLocation } from "./common.types";
import type { ISODateTime } from "./api.types";

/** Khớp `TripStatus` của backend (`trip/TripStatus.java`). */
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type TripStopType = "pickup" | "delivery" | "break" | "terminal";

export interface TripResponse {
  id: string;
  number: number;
  name: string;
  totalDistance: number;
  dispatchedAt?: ISODateTime | null;
  completedAt?: ISODateTime | null;
  cancelledAt?: ISODateTime | null;
  status: TripStatus;
  truckId?: string | null;
  truckNumber?: string | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
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
