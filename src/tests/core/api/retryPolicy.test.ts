/** Verifies that Refine retries only bounded transient query failures. */

import { describe, expect, it } from "vitest";

import { ApiHttpError } from "@core/api/httpError";
import {
  MAX_TRANSIENT_QUERY_RETRIES,
  shouldRetryQuery,
} from "@core/api/retryPolicy";

const error = (statusCode: number, code = `HTTP_${statusCode}`) =>
  new ApiHttpError({
    statusCode,
    code,
    message: code,
    requestId: null,
  });

describe("shouldRetryQuery", () => {
  it.each([400, 401, 403, 404])("does not retry HTTP %s", (status) => {
    expect(shouldRetryQuery(0, error(status))).toBe(false);
  });

  it("retries network and server failures within the configured bound", () => {
    expect(shouldRetryQuery(0, error(0, "ERR_NETWORK"))).toBe(true);
    expect(shouldRetryQuery(1, error(503))).toBe(true);
    expect(
      shouldRetryQuery(MAX_TRANSIENT_QUERY_RETRIES, error(503)),
    ).toBe(false);
  });

  it("does not retry deterministic response-contract failures", () => {
    expect(
      shouldRetryQuery(0, error(500, "INVALID_API_RESPONSE")),
    ).toBe(false);
  });
});
