/**
 * Verifies one-based pagination and declared query-field enforcement.
 */

import type { CrudFilters } from "@refinedev/core";
import { describe, expect, it } from "vitest";

import {
  normalizePage,
  normalizePageSize,
  serializeCustomQuery,
  serializeListQuery,
} from "./querySerializer";

describe("list query serialization", () => {
  it("normalizes one-based pagination and clamps page size", () => {
    expect(normalizePage(0)).toBe(1);
    expect(normalizePage(4.8)).toBe(4);
    expect(normalizePageSize(-2)).toBe(1);
    expect(normalizePageSize(1_000)).toBe(100);
    expect(normalizePageSize(undefined)).toBe(20);
  });

  it("omits empty filters while retaining false and serializing one sorter", () => {
    expect(
      serializeListQuery({
        pagination: {
          current: 2,
          pageSize: 50,
        },
        filters: [
          {
            field: "search",
            operator: "contains",
            value: "  ",
          },
          {
            field: "active",
            operator: "eq",
            value: false,
          },
        ],
        sorters: [{ field: "name", order: "desc" }],
        allowedFilterFields: ["search", "active"],
        allowedSortFields: ["name"],
      }),
    ).toEqual({
      page: 2,
      pageSize: 50,
      active: false,
      orderBy: "name",
      descending: true,
    });
  });

  it("rejects undeclared fields and unsupported conditional filters", () => {
    expect(() =>
      serializeListQuery({
        filters: [
          {
            field: "internalValue",
            operator: "eq",
            value: "hidden",
          },
        ],
        allowedFilterFields: ["search"],
        allowedSortFields: [],
      }),
    ).toThrow("FILTER_FIELD_NOT_ALLOWED:internalValue");

    const conditionalFilters: CrudFilters = [
      {
        operator: "or",
        value: [
          {
            field: "search",
            operator: "contains",
            value: "one",
          },
        ],
      },
    ];

    expect(() =>
      serializeListQuery({
        filters: conditionalFilters,
        allowedFilterFields: ["search"],
        allowedSortFields: [],
      }),
    ).toThrow("UNSUPPORTED_CONDITIONAL_FILTER");
  });

  it("serializes explicit custom query values and omits empty values", () => {
    expect(
      serializeCustomQuery({
        conversationId: "conversation-1",
        employeeId: "",
        unreadOnly: true,
      }),
    ).toEqual({
      conversationId: "conversation-1",
      unreadOnly: true,
    });
  });
});
