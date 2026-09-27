import type { Address, GeoLocation } from "./common.types";
import type { Load } from "./load.types";
import type { Truck } from "./truck.types";
import type { TripStatus, TripStopType, TripStopResponse } from "./trip.dto";

export interface Trip {
  id: string;
  number: number;
  name: string;
  totalDistance: number;
  dispatchedAt?: string | Date | null;
  completedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  status: TripStatus;
  truckId?: string | null;
  truckNumber?: string | null;
  stops?: TripStopResponse[] | TripStop[];
  createdAt?: string | Date;
  createdBy?: string | null;
  lastModifiedAt?: string | Date | null;
  lastModifiedBy?: string | null;
}

export interface TripStop {
  id: string;
  type: TripStopType;
  order: number;
  loadId: string;
  arrivedAt?: string | Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  tripId?: string;
  address?: Address;
  location?: GeoLocation;
}

export interface TripWithRelations extends Trip {
  truck?: Truck | null;
  stops?: TripStop[];
}

export interface TripStopWithRelations extends TripStop {
  load?: Load;
}
