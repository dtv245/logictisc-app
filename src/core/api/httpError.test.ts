/**
 * Verifies backend error-envelope mapping to Refine field errors.
 */

import { describe, expect, it } from "vitest";

import {
  ApiHttpError,
  toRefineHttpError,
} from "../errors/httpError";

describe("toRefineHttpError", () => {
  it("groups field errors and preserves backend code and request ID", () => {
    const error = toRefineHttpError(400, {
      success: false,
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
      data: null,
      errors: [
        {
          field: "email",
          code: "Email",
          message: "invalid",
        },
        {
          field: "email",
          code: "Unique",
          message: "duplicate",
        },
        {
          field: null,
          code: "Global",
          message: "global",
        },
      ],
      meta: {
        timestamp: "2026-07-27T03:00:00Z",
        path: "/api/employees",
        requestId: "1c942799-f11b-4191-827c-d3a87e2dfa29",
      },
    });

    expect(error).toBeInstanceOf(ApiHttpError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("Request validation failed");
    expect(error.requestId).toBe(
      "1c942799-f11b-4191-827c-d3a87e2dfa29",
    );
    expect(error.errors).toEqual({
      email: ["invalid", "duplicate"],
    });
    expect(error.backendErrors).toHaveLength(3);
  });

  it("uses technical fallbacks when a response is not an envelope", () => {
    const error = toRefineHttpError(500, null, {
      fallbackCode: "ERR_NETWORK",
      fallbackMessage: "Network failed",
      fallbackRequestId: "request-from-header",
    });

    expect(error).toMatchObject({
      statusCode: 500,
      code: "ERR_NETWORK",
      message: "Network failed",
      requestId: "request-from-header",
    });
    expect(error.errors).toBeUndefined();
  });
});
