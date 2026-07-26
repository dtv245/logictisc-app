/**
 * Chứa các kiểu dữ liệu envelope, phân trang và lỗi dùng cho API.
 */

import type { HttpError } from "@refinedev/core";

export interface ApiEnvelope<TResult> {
  code: number;
  message: string;
  result: TResult;
}

export interface ApiPage<TResult> {
  content: TResult[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type ApiValidationErrors = Record<string, string[]>;

export interface ApiError extends HttpError {
  statusCode: number;
  message: string;
  errors?: ApiValidationErrors;
}

export interface ApiErrorPayload {
  code?: number;
  status?: number;
  statusCode?: number;
  message?: string;
  detail?: string;
  title?: string;
  error?: string;
  errors?: unknown;
  fieldErrors?: unknown;
  violations?: unknown;
}
