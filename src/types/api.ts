import type { HttpError } from "@refinedev/core";

export interface ApiEnvelope<TResult> {
  code: number;
  message: string;
  result: TResult;
}

export interface ApiPage<TResult> {
  items: TResult[];
  page: number;
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
  error?: string;
  errors?: Record<string, string | string[]>;
}
