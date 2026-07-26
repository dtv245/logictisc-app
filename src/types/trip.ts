/**
 * Chứa các kiểu dữ liệu hành trình và điểm dừng.
 */

import type { Address, AuditableEntity, GeoLocation } from "./common";
import type { Load } from "./load";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TripStatus =
  | "draft"
  | "planned"
  | "dispatched"
  | "in_progress"
  | "completed"
  | "cancelled";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type TripStopType = "pickup" | "delivery" | "break" | "terminal";

/** Hành trình gom một hoặc nhiều chuyến hàng trên cùng xe tải. */
export interface Trip extends AuditableEntity {
  id: string;
  number: number;
  name: string;
  totalDistance: number;
  dispatchedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  status: TripStatus;
  truckId?: string | null;
}

/** Một điểm dừng theo thứ tự trong hành trình. */
export interface TripStop {
  id: string;
  type: TripStopType;
  tripId: string;
  order: number;
  arrivedAt?: string | null;
  loadId: string;
  address: Address;
  location: GeoLocation;
}

/** Hành trình kèm xe tải và danh sách điểm dừng. */
export interface TripWithRelations extends Trip {
  truck?: Truck | null;
  stops?: TripStop[];
}

/** Điểm dừng kèm chuyến hàng liên quan. */
export interface TripStopWithRelations extends TripStop {
  load?: Load;
}
