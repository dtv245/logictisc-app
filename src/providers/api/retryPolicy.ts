/**
 * Defines Refine query retry decisions without duplicating Axios 401 replay.
 */

import { ApiHttpError, normalizeHttpError } from "./httpError";

export const MAX_TRANSIENT_QUERY_RETRIES = 2;

export const shouldRetryQuery = (
  failureCount: number,
  error: unknown,
): boolean => {
  if (failureCount >= MAX_TRANSIENT_QUERY_RETRIES) {
    return false;
  }

  const apiError =
    error instanceof ApiHttpError ? error : normalizeHttpError(error);

  // Protocol violations are deterministic and cannot recover by repeating the
  // same request. Axios already owns the single refresh/replay attempt for 401.
  if (apiError.code.startsWith("INVALID_")) {
    return false;
  }

  return apiError.statusCode === 0 || apiError.statusCode >= 500;
};
