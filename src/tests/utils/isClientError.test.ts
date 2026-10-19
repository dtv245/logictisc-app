import { describe, expect, it } from "vitest";
import { isClientError } from "@/utils/isClientError";

describe("isClientError", () => {
  it("identifies 4xx statusCode from Refine HttpError", () => {
    expect(isClientError({ statusCode: 400, message: "Bad Request" })).toBe(true);
    expect(isClientError({ statusCode: 401, message: "Unauthorized" })).toBe(true);
    expect(isClientError({ statusCode: 403, message: "Forbidden" })).toBe(true);
    expect(isClientError({ statusCode: 404, message: "Not Found" })).toBe(true);
    expect(isClientError({ statusCode: 422, message: "Unprocessable Entity" })).toBe(true);
    expect(isClientError({ statusCode: 499, message: "Client Closed Request" })).toBe(true);
  });

  it("identifies 4xx status from response object", () => {
    expect(isClientError({ response: { status: 400 } })).toBe(true);
    expect(isClientError({ response: { status: 404 } })).toBe(true);
  });

  it("identifies 4xx status from direct status property", () => {
    expect(isClientError({ status: 400 })).toBe(true);
    expect(isClientError({ status: 403 })).toBe(true);
  });

  it("returns false for 5xx Server Errors", () => {
    expect(isClientError({ statusCode: 500 })).toBe(false);
    expect(isClientError({ statusCode: 502 })).toBe(false);
    expect(isClientError({ statusCode: 503 })).toBe(false);
    expect(isClientError({ response: { status: 500 } })).toBe(false);
    expect(isClientError({ status: 500 })).toBe(false);
  });

  it("returns false for non-4xx numbers, null, undefined and non-objects", () => {
    expect(isClientError(null)).toBe(false);
    expect(isClientError(undefined)).toBe(false);
    expect(isClientError("error")).toBe(false);
    expect(isClientError(400)).toBe(false);
    expect(isClientError({ statusCode: 200 })).toBe(false);
    expect(isClientError({ statusCode: 302 })).toBe(false);
    expect(isClientError({})).toBe(false);
  });
});
