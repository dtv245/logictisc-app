import type { ISODateTime } from "./api.types";

/** Khớp `TripStatus` của backend (`trip/TripStatus.java`). */
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type TripStopType = "pickup" | "delivery" | "break" | "terminal";

/**
 * Stop con nằm trong Trip (`TripStopResponse.java`).
 * Địa chỉ và toạ độ là các trường phẳng.
 */
export interface TripStopResponse {
  id: string;
  type: TripStopType | string;
  order: number;
  loadId: string;
  arrivedAt?: ISODateTime | null;
  addressLine1: string;
  addressLine2?: string | null;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  locationLatitude: number;
  locationLongitude: number;
}

/**
 * Data Transfer Object (DTO) nhận trực tiếp từ API Backend trả về (`TripResponse.java`).
 * Bao gồm mảng `stops: TripStopResponse[]` nhúng trực tiếp.
 */
export interface TripResponse {
  id: string;
  number: number;
  name: string;
  totalDistance: number;
  status: TripStatus;
  dispatchedAt?: ISODateTime | null;
  completedAt?: ISODateTime | null;
  cancelledAt?: ISODateTime | null;
  truckId?: string | null;
  truckNumber?: string | null;
  stops: TripStopResponse[];
}

/**
 * Payload stop con gửi lên API để tạo mới/sửa Trip (`TripStopRequest.java`).
 */
export interface TripStopRequest {
  type: TripStopType | string;
  order: number;
  loadId: string;
  addressLine1: string;
  addressLine2?: string | null;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  locationLatitude: number;
  locationLongitude: number;
}

/**
 * Payload gửi lên API để tạo mới Trip (`CreateTripRequest.java`).
 */
export interface CreateTripRequest {
  name: string;
  totalDistance: number;
  status: TripStatus | string;
  truckId?: string | null;
  stops: TripStopRequest[];
}

/**
 * Payload gửi lên API để cập nhật Trip (`PUT /api/trips/{id}`).
 */
export type UpdateTripRequest = Partial<CreateTripRequest>;
