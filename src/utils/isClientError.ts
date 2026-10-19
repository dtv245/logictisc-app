import type { HttpError } from "@refinedev/core";

/**
 * Checks whether an error represents an HTTP 4xx Client Error (400 - 499).
 * Recognizes Refine's HttpError (`statusCode`), generic status objects,
 * or Axios error envelopes (`response.status`).
 */
export function isClientError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  // Refine HttpError
  if ("statusCode" in error && typeof (error as HttpError).statusCode === "number") {
    const code = (error as HttpError).statusCode;
    return code >= 400 && code < 500;
  }

  // Generic status property
  if ("status" in error && typeof (error as { status: unknown }).status === "number") {
    const code = (error as { status: number }).status;
    return code >= 400 && code < 500;
  }

  // Axios response status: error.response?.status
  if (
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "status" in error.response &&
    typeof (error.response as { status: unknown }).status === "number"
  ) {
    const code = (error.response as { status: number }).status;
    return code >= 400 && code < 500;
  }

  return false;
}
