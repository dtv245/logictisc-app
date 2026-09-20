/**
 * Maps Spring error envelopes to Refine v4 `HttpError` instances.
 *
 * Field errors are grouped for Ant Design form integration, while the backend
 * code and request ID remain available for state-specific UX and support.
 */

import type { HttpError } from "@refinedev/core";
import axios, { AxiosHeaders } from "axios";

import { isRecord, readApiResponse } from "./envelope";
import type { BackendApiError } from "../../types/api.types";

export type RefineFieldErrors = Record<string, string[]>;

export interface ApiHttpErrorOptions {
  statusCode: number;
  message: string;
  code: string;
  requestId: string | null;
  backendErrors?: BackendApiError[] | undefined;
  fieldErrors?: RefineFieldErrors | undefined;
  cause?: unknown;
}

export class ApiHttpError extends Error implements HttpError {
  readonly statusCode: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly backendErrors: BackendApiError[];
  readonly errors?: RefineFieldErrors;

  constructor(options: ApiHttpErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "ApiHttpError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.requestId = options.requestId;
    this.backendErrors = options.backendErrors ?? [];
    if (options.fieldErrors) {
      this.errors = options.fieldErrors;
    }
  }
}

const groupFieldErrors = (
  backendErrors: BackendApiError[],
): RefineFieldErrors | undefined => {
  const grouped = new Map<string, string[]>();

  for (const error of backendErrors) {
    if (!error.field) {
      continue;
    }

    const messages = grouped.get(error.field) ?? [];
    // Một field có thể có nhiều constraint lỗi; giữ toàn bộ thay vì chỉ lấy
    // message cuối để Ant Design hiển thị đúng phản hồi backend.
    messages.push(error.message);
    grouped.set(error.field, messages);
  }

  return grouped.size > 0
    ? Object.fromEntries(grouped.entries())
    : undefined;
};

export const toRefineHttpError = (
  statusCode: number,
  body: unknown,
  options?: {
    fallbackCode?: string | undefined;
    fallbackMessage?: string | undefined;
    fallbackRequestId?: string | null | undefined;
    cause?: unknown;
  },
): ApiHttpError => {
  // readApiResponse xử lý envelope thành công/lỗi theo cùng contract, còn các
  // fallback giữ được thông tin transport khi body trống hoặc không hợp lệ.
  const envelope = readApiResponse(body);
  const backendErrors = envelope?.errors ?? [];
  const code =
    envelope?.code || options?.fallbackCode || `HTTP_${statusCode}`;
  const message =
    envelope?.message || options?.fallbackMessage || code;

  return new ApiHttpError({
    statusCode,
    code,
    message,
    requestId:
      envelope?.meta.requestId ?? options?.fallbackRequestId ?? null,
    backendErrors,
    fieldErrors: groupFieldErrors(backendErrors),
    cause: options?.cause,
  });
};

const readRequestIdHeader = (value: unknown): string | null => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
};

const readResponseRequestId = (headers: unknown): string | null => {
  // Axios có thể trả AxiosHeaders hoặc plain object tùy adapter/test double.
  if (headers instanceof AxiosHeaders) {
    return readRequestIdHeader(headers.get("x-request-id"));
  }

  if (!isRecord(headers)) {
    return null;
  }

  const record = headers as Record<string, unknown>;
  return readRequestIdHeader(
    record["x-request-id"] ?? record["X-Request-Id"],
  );
};

export const normalizeHttpError = (error: unknown): ApiHttpError => {
  if (error instanceof ApiHttpError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status ?? 0;
    const requestId = readResponseRequestId(error.response?.headers);

    return toRefineHttpError(statusCode, error.response?.data, {
      fallbackCode: error.code ?? undefined,
      fallbackMessage: error.message,
      fallbackRequestId: requestId,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiHttpError({
      statusCode: 0,
      code: error.name,
      message: error.message,
      requestId: null,
      cause: error,
    });
  }

  return new ApiHttpError({
    statusCode: 0,
    code: "UNKNOWN_TRANSPORT_ERROR",
    message: "UNKNOWN_TRANSPORT_ERROR",
    requestId: null,
    cause: error,
  });
};
