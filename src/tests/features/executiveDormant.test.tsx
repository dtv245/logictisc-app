/**
 * Proves the dormant Executive hook issues no request and surfaces unavailable
 * sections rather than numbers.
 *
 * `useQueries` is intercepted so the test can inspect the real query objects the
 * hook builds: every one must be disabled, and the monthly query must ask for
 * year/month/currency — never from/to — when it eventually runs.
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  queries: [] as Array<{
    queryKey: unknown[];
    enabled: boolean;
    queryFn: () => Promise<unknown>;
  }>,
  custom: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueries: (options: { queries: typeof harness.queries }) => {
    harness.queries = options.queries;
    return options.queries.map(() => ({
      data: undefined,
      isLoading: false,
      isError: false,
    }));
  },
}));

vi.mock("@refinedev/core", () => ({
  useCan: () => ({ data: { can: true }, isLoading: false }),
  useList: () => ({ data: { total: 12 }, isLoading: false }),
  useDataProvider: () => () => ({ custom: harness.custom }),
}));

import { useExecutiveData } from "@features/executive/api/executive.queries";
import { SECTION_REASONS } from "@features/executive/utils/executive.metrics";

describe("useExecutiveData while Executive is dormant", () => {
  beforeEach(() => {
    harness.queries = [];
    harness.custom.mockReset();
  });

  it("builds only monthly queries and disables every one", () => {
    const { result } = renderHook(() => useExecutiveData("longHaul", 6));

    expect(harness.queries).toHaveLength(6);
    expect(harness.queries.every((query) => query.enabled === false)).toBe(true);
    // No fleet-health query exists in the Executive context: it requires a
    // policyId and truckIds this screen cannot verify.
    expect(harness.queries).toHaveLength(6);

    expect(result.current.monthlyPoints).toBeNull();
    expect(result.current.costCategories).toBeNull();
    expect(result.current.concentration).toBeNull();
    expect(result.current.aging).toBeNull();
    expect(result.current.monthlyReasonKey).toBe(
      SECTION_REASONS.featureDormant,
    );
    expect(result.current.concentrationReasonKey).toBe(
      SECTION_REASONS.endpointMissing,
    );
    expect(result.current.agingReasonKey).toBe(SECTION_REASONS.endpointMissing);
  });

  it("keeps every reporting KPI unavailable, apart from real CRUD counts", () => {
    const { result } = renderHook(() => useExecutiveData(null, 3));

    const reportingKpis = result.current.kpis.filter(
      (kpi) =>
        kpi.definition.id !== "fleetSize" &&
        kpi.definition.id !== "activeCustomerCount",
    );
    expect(reportingKpis.length).toBeGreaterThan(10);
    expect(
      reportingKpis.every((kpi) => kpi.current.status === "unavailable"),
    ).toBe(true);
    expect(result.current.insights).toEqual([]);
  });

  it("requests the monthly endpoint with year/month/currency when enabled", async () => {
    renderHook(() => useExecutiveData(null, 1));
    const [query] = harness.queries;
    harness.custom.mockResolvedValue({
      data: { year: 2026, month: 1, totalRevenue: 100 },
    });

    await query.queryFn();

    expect(harness.custom).toHaveBeenCalledTimes(1);
    const request = harness.custom.mock.calls[0][0] as {
      url: string;
      method: string;
      query: Record<string, unknown>;
    };
    expect(request.url).toBe("/api/reports/financials/monthly");
    expect(request.method).toBe("get");
    expect(request.query).toEqual({
      year: expect.any(Number),
      month: expect.any(Number),
      currency: expect.any(String),
    });
    expect(request.query).not.toHaveProperty("from");
    expect(request.query).not.toHaveProperty("to");
  });
});
