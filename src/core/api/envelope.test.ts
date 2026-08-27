/**
 * Verifies strict parsing of the common Spring response contracts.
 */

import { describe, expect, it } from "vitest";

import { readApiResponse, readPagedResponse } from "./envelope";

const meta = {
  timestamp: "2026-07-27T03:00:00Z",
  path: "/api/widgets",
  requestId: "8a176d1e-6fb5-44f4-b909-ffa178cdac2b",
};

describe("readApiResponse", () => {
  it("reads an exact envelope without changing a null payload", () => {
    expect(
      readApiResponse({
        success: true,
        code: "SUCCESS",
        message: "SUCCESS",
        data: null,
        errors: [],
        meta,
      }),
    ).toEqual({
      success: true,
      code: "SUCCESS",
      message: "SUCCESS",
      data: null,
      errors: [],
      meta,
    });
  });

  it("rejects envelopes that omit required data or metadata", () => {
    expect(
      readApiResponse({
        success: true,
        code: "SUCCESS",
        message: "SUCCESS",
        errors: [],
        meta,
      }),
    ).toBeNull();

    expect(
      readApiResponse({
        success: false,
        code: "VALIDATION_FAILED",
        message: "VALIDATION_FAILED",
        data: null,
        errors: [],
        meta: {
          timestamp: "2026-07-27T03:00:00Z",
          path: "/api/widgets",
        },
      }),
    ).toBeNull();
  });
});

describe("readPagedResponse", () => {
  it("reads the one-based paged response", () => {
    expect(
      readPagedResponse<{ id: string }>({
        items: [{ id: "widget-1" }],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 20,
      }),
    ).toEqual({
      items: [{ id: "widget-1" }],
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    });
  });

  it("rejects zero-based pages and an oversized server page", () => {
    expect(
      readPagedResponse({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 20,
      }),
    ).toBeNull();

    expect(
      readPagedResponse({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 101,
      }),
    ).toBeNull();
  });
});
