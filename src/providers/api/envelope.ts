/**
 * Validates common API envelopes at the HTTP boundary.
 *
 * Domain payload validation remains the responsibility of each feature, while
 * this module rejects malformed common metadata and pagination structures.
 */

import type {
  BackendApiError,
  ApiResponse,
  PagedResponse,
  ResponseMeta,
  ErrorParams,
} from "../../types/api.types";

export const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Ignore malformed optional interpolation metadata without losing the legacy envelope.
const readParams = (value: unknown): ErrorParams | undefined => {
  if (!isRecord(value)) return undefined;
  const params: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key) || key === "constructor" || key === "prototype") continue;
    if (typeof item === "string" || typeof item === "boolean" || (typeof item === "number" && Number.isFinite(item))) params[key] = item;
  }
  return params;
};

const readApiError = (value: unknown): BackendApiError | null => {
  if (
    !isRecord(value) ||
    (value.field !== null && typeof value.field !== "string") ||
    typeof value.code !== "string" ||
    typeof value.message !== "string"
  ) {
    return null;
  }

  return {
    field: value.field,
    code: value.code,
    message: value.message,
    ...(readParams(value.params) ? { params: readParams(value.params) } : {}),
  };
};

const readResponseMeta = (value: unknown): ResponseMeta | null => {
  if (
    !isRecord(value) ||
    typeof value.timestamp !== "string" ||
    typeof value.path !== "string" ||
    (value.requestId !== null && typeof value.requestId !== "string")
  ) {
    return null;
  }

  return {
    timestamp: value.timestamp,
    path: value.path,
    requestId: value.requestId,
  };
};

export const readApiResponse = (
  value: unknown,
): ApiResponse<unknown> | null => {
  if (
    !isRecord(value) ||
    !("data" in value) ||
    value.data === undefined ||
    typeof value.success !== "boolean" ||
    typeof value.code !== "string" ||
    typeof value.message !== "string" ||
    !Array.isArray(value.errors)
  ) {
    return null;
  }

  const errors = value.errors.map(readApiError);
  const meta = readResponseMeta(value.meta);
  if (errors.some((error) => error === null) || meta === null) {
    return null;
  }

  return {
    success: value.success,
    code: value.code,
    message: value.message,
    data: value.data,
    errors: errors.filter((error): error is BackendApiError => error !== null),
    meta,
    ...(readParams(value.params) ? { params: readParams(value.params) } : {}),
  };
};

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;

export const readPagedResponse = <TItem>(
  value: unknown,
): PagedResponse<TItem> | null => {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !isNonNegativeInteger(value.totalItems) ||
    !isNonNegativeInteger(value.totalPages) ||
    !isPositiveInteger(value.currentPage) ||
    !isPositiveInteger(value.pageSize) ||
    value.pageSize > 100
  ) {
    return null;
  }

  // The common envelope can validate that `items` is an array, but only the
  // owning feature knows the runtime schema of each DTO in that array.
  const items = value.items as TItem[];

  return {
    items,
    totalItems: value.totalItems,
    totalPages: value.totalPages,
    currentPage: value.currentPage,
    pageSize: value.pageSize,
  };
};
