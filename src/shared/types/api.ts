/**
 * Defines the transport contracts shared by every Logistics API feature.
 *
 * These types mirror the Spring `ApiResponse` and `PagedResponse` DTOs. They
 * intentionally do not contain view-model or feature-specific fields.
 */

export type UUID = string;

export type ISODateTime = string;

export interface ApiError {
  field: string | null;
  code: string;
  message: string;
}

export interface ResponseMeta {
  timestamp: string;
  path: string;
  requestId: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
  errors: ApiError[];
  meta: ResponseMeta;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  descending?: boolean;
}
