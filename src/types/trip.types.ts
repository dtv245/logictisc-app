import type { Address, GeoLocation } from "./common.types";
import type { Load } from "./load.types";
import type { Truck } from "./truck.types";
import type { TripStatus, TripStopType } from "./trip.dto";

export interface Trip {
  id: string;
  number: number;
  name: string;
  totalDistance: number;
  dispatchedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  status: TripStatus;
  truckId?: string | null;
  truckNumber?: string | null;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
  lastModifiedBy?: string | null;
}

export interface TripStop {
  id: string;
  type: TripStopType;
  tripId: string;
  order: number;
  arrivedAt?: Date | null;
  loadId: string;
  address: Address;
  location: GeoLocation;
}

export interface TripWithRelations extends Trip {
  truck?: Truck | null;
  stops?: TripStop[];
}

export interface TripStopWithRelations extends TripStop {
  load?: Load;
}
