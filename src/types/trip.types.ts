import type { Address, GeoLocation } from "./common.types";
import type { Load } from "./load.types";
import type { Truck } from "./truck.types";
import type { TripResponse, TripStopType } from "./trip.dto";
import type { ISODateTime } from "./api.types";

export type Trip = TripResponse;

export interface TripStop {
  id: string;
  type: TripStopType;
  tripId: string;
  order: number;
  arrivedAt?: ISODateTime | null;
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
