import type { HttpError } from "@refinedev/core";

export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

/**
 * Lỗi chi tiết (DTO) do Spring Boot backend trả về trong mảng `errors`.
 */
export interface BackendApiError {
  field: string | null;
  code: string;
  message: string;
  params?: ErrorParams;
}

export type ErrorParams = Readonly<Record<string, string | number | boolean>>;

export interface ResponseMeta {
  timestamp: string;
  path: string;
  requestId: string | null;
}

/**
 * Envelope chuẩn của toàn bộ API hệ thống.
 */
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
  errors: BackendApiError[];
  meta: ResponseMeta;
  params?: ErrorParams;
}

/**
 * DTO trả về cho các API có phân trang.
 */
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

export type ApiValidationErrors = Record<string, string[]>;

/**
 * Error Interface dùng cho Refine Hooks (kế thừa HttpError của Refine).
 * Được ném ra bởi HTTP Client khi gọi API thất bại.
 */
export interface ApiError extends HttpError {
  statusCode: number;
  message: string;
  errors?: ApiValidationErrors;
}

export type RefineFieldErrors = Record<string, string[]>;

export interface ApiHttpErrorOptions {
  statusCode: number;
  message: string;
  code: string;
  requestId: string | null;
  backendErrors?: BackendApiError[] | undefined;
  fieldErrors?: RefineFieldErrors | undefined;
  cause?: unknown;
  params?: ErrorParams;
  retryAfterSeconds?: number;
}

export interface ToRefineHttpErrorOptions {
  fallbackCode?: string | undefined;
  fallbackMessage?: string | undefined;
  fallbackRequestId?: string | null | undefined;
  cause?: unknown;
  retryAfterSeconds?: number;
}
