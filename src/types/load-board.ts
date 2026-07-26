/**
 * Chứa các kiểu dữ liệu tích hợp load board, listing và xe được đăng.
 */

import type {
  Address,
  AuditableEntity,
  GeoLocation,
  Money,
  OptionalAddress,
} from "./common";
import type { Load } from "./load";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadBoardProviderType =
  | "dat"
  | "truckstop"
  | "123loadboard"
  | "other";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadBoardListingStatus =
  | "available"
  | "booked"
  | "expired"
  | "cancelled";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type PostedTruckStatus =
  | "draft"
  | "posted"
  | "matched"
  | "expired"
  | "cancelled";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type LoadBoardEquipmentType =
  | "dry_van"
  | "flatbed"
  | "reefer"
  | "power_only"
  | "box_truck";

/** Cấu hình kết nối tenant với một nhà cung cấp load board. */
export interface LoadBoardConfiguration {
  id: string;
  providerType: LoadBoardProviderType;
  apiKey: string;
  apiSecret?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
  lastSyncedAt?: string | null;
  externalAccountId?: string | null;
  companyDotNumber?: string | null;
  companyMcNumber?: string | null;
}

/** Load bên ngoài được đồng bộ từ load board. */
export interface LoadBoardListing extends AuditableEntity {
  id: string;
  externalListingId: string;
  providerType: LoadBoardProviderType;
  ratePerMile?: number | null;
  distance?: number | null;
  weight?: number | null;
  length?: number | null;
  pickupDateStart?: string | null;
  pickupDateEnd?: string | null;
  deliveryDateStart?: string | null;
  deliveryDateEnd?: string | null;
  equipmentType?: LoadBoardEquipmentType | null;
  commodity?: string | null;
  brokerName?: string | null;
  brokerPhone?: string | null;
  brokerEmail?: string | null;
  brokerMcNumber?: string | null;
  status: LoadBoardListingStatus;
  bookedAt?: string | null;
  loadId?: string | null;
  notes?: string | null;
  rawJson?: unknown | null; // TODO: định nghĩa shape cụ thể khi biết rõ payload.
  expiresAt: string;
  destinationAddress: Address;
  destinationLocation: GeoLocation;
  originAddress: Address;
  originLocation: GeoLocation;
  totalRate?: Money | null;
}

/** Xe tải được đăng là sẵn sàng trên load board. */
export interface PostedTruck extends AuditableEntity {
  id: string;
  truckId: string;
  providerType: LoadBoardProviderType;
  externalPostId?: string | null;
  destinationRadius?: number | null;
  availableFrom: string;
  availableTo?: string | null;
  equipmentType?: LoadBoardEquipmentType | null;
  maxWeight?: number | null;
  maxLength?: number | null;
  status: PostedTruckStatus;
  expiresAt?: string | null;
  lastRefreshedAt?: string | null;
  availableAtAddress: Address;
  availableAtLocation: GeoLocation;
  destinationPreference?: OptionalAddress | null;
}

/** Listing kèm load nội bộ được tạo sau khi booking. */
export interface LoadBoardListingWithRelations extends LoadBoardListing {
  load?: Load | null;
}

/** Bài đăng xe kèm xe tải nội bộ. */
export interface PostedTruckWithRelations extends PostedTruck {
  truck?: Truck;
}
