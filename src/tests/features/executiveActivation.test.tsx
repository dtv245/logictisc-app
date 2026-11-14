/**
 * Activation tests for the Executive hook.
 *
 * Proves that:
 *   - the four aggregate routes are requested with the exact backend params;
 *   - monthly is requested per month with year/month/currency;
 *   - a caller without `reports:EXECUTIVE_VIEW` issues no request at all;
 *   - responses are mapped without turning null/unavailable into zero.
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CapturedQuery = {
  queryKey: unknown[];
  enabled: boolean;
  queryFn: () => Promise<unknown>;
};

type CapturedCustom = {
  url: string;
  method: string;
  config: { query: Record<string, unknown> };
  queryOptions: { enabled?: boolean };
};

const harness = vi.hoisted(() => ({
  queries: [] as CapturedQuery[],
  customCalls: [] as CapturedCustom[],
  canView: true,
  responses: {} as Record<string, unknown>,
  errors: {} as Record<string, boolean>,
  monthlyData: [] as Array<unknown>,
  providerCustom: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueries: (options: { queries: CapturedQuery[] }) => {
    harness.queries = options.queries;
    return options.queries.map((_query, index) => ({
      data: harness.monthlyData[index],
      isLoading: false,
      isError: false,
    }));
  },
}));

vi.mock("@refinedev/core", () => ({
  useCan: () => ({
    data: { can: harness.canView },
    isLoading: false,
  }),
  useDataProvider: () => () => ({ custom: harness.providerCustom }),
  useCustom: (args: CapturedCustom) => {
    harness.customCalls.push(args);
    const response = harness.responses[args.url];
    return {
      data: response === undefined ? undefined : { data: response },
      isLoading: false,
      isError: harness.errors[args.url] === true,
    };
  },
}));

import { useExecutiveData } from "@features/executive/api/executive.queries";
import { SECTION_REASONS } from "@features/executive/utils/executive.metrics";
import type { MetricDto } from "@/types/reports/report.dto";

const metric = (changes: Partial<MetricDto> = {}): MetricDto => ({
  code: "TEST",
  value: 10,
  unit: "PERCENT",
  numerator: null,
  denominator: null,
  availability: "AVAILABLE",
  basis: "TEST_BASIS",
  reason: null,
  ...changes,
});

const unavailable = (reason: string): MetricDto => ({
  ...metric(),
  value: null,
  availability: "UNAVAILABLE",
  basis: null,
  reason,
});

const responses = () => ({
  "/api/reports/executive-summary": {
    period: { from: "2026-09-01", to: "2026-11-14" },
    generatedAt: "2026-11-14T03:00:00Z",
    fleetSize: metric({ code: "FLEET_SIZE", value: 12, unit: "VEHICLES" }),
    activeCustomers: metric({ code: "ACTIVE_CUSTOMERS", value: 7, unit: "CUSTOMERS" }),
    onTimeDeliveryPct: unavailable("NO_DELIVERED_LOADS_IN_PERIOD"),
    trucksWithLoadsPct: metric({ value: 50 }),
    loadedMilesPct: metric({ value: 75 }),
    fleetUtilizationPct: unavailable("NO_VEHICLE_AVAILABILITY_HISTORY"),
    difotPct: unavailable("DIFOT_NOT_DEFINED_IN_SYSTEM"),
    completeness: { sourceRowCounts: {}, unavailableMetrics: [], limitations: [] },
  },
  "/api/reports/costs/by-category": {
    currency: "VND",
    period: { from: "2026-09-01", to: "2026-11-14" },
    previousPeriod: { from: "2026-06-18", to: "2026-08-31" },
    totalCost: metric({ code: "TOTAL_COST", value: 160, availability: "PARTIAL" }),
    maintenanceCost: unavailable("MAINTENANCE_CURRENCY_NOT_STORED"),
    maintenanceRecordCount: 1,
    ambiguousTruckLinkCount: 0,
    categories: [
      {
        category: "FUEL",
        currentTotal: metric({ value: 100, unit: "VND" }),
        previousTotal: metric({ value: 80, unit: "VND" }),
        shareOfTotal: metric({ value: 62.5 }),
        currentRowCount: 1,
        previousRowCount: 1,
      },
    ],
    completeness: { sourceRowCounts: {}, unavailableMetrics: [], limitations: [] },
  },
  "/api/reports/customers/concentration": {
    currency: "VND",
    period: { from: "2026-09-01", to: "2026-11-14" },
    totalRevenue: metric({ value: 2300, unit: "VND" }),
    attributedRevenue: metric({ value: 2100, unit: "VND" }),
    unlinkedRevenue: metric({ value: 200, unit: "VND" }),
    top1Share: metric({ value: 61.9 }),
    top3Share: metric({ value: 100 }),
    top5Share: metric({ value: 100 }),
    hhi: metric({ value: 5283.45, unit: "INDEX_0_TO_10000" }),
    customersConsidered: 2,
    customersReturned: 1,
    customersWithoutRevenue: 1,
    invoicesWithoutCustomer: 1,
    limit: 10,
    rows: [
      {
        customerId: "00000000-0000-0000-0000-000000000001",
        customerName: "Acme",
        revenue: metric({ value: 1300, unit: "VND" }),
        shareOfRevenue: metric({ value: 61.9 }),
        invoiceCount: 2,
      },
      {
        customerId: "00000000-0000-0000-0000-000000000002",
        customerName: null,
        revenue: metric({ value: 800, unit: "VND" }),
        shareOfRevenue: metric({ value: 38.1 }),
        invoiceCount: 1,
      },
    ],
    completeness: { sourceRowCounts: {}, unavailableMetrics: [], limitations: [] },
  },
  "/api/reports/receivables/aging": {
    currency: "VND",
    asOf: "2026-11-14",
    revenueWindow: { from: "2026-09-01", to: "2026-11-14" },
    outstandingTotal: metric({ value: 1800, unit: "VND" }),
    overdueTotal: metric({ value: 1300, unit: "VND" }),
    dsoDays: metric({ value: 24.26, unit: "DAYS", availability: "PARTIAL" }),
    buckets: [
      {
        id: "current",
        amount: metric({ value: 300, unit: "VND" }),
        shareOfOutstanding: metric({ value: 16.67 }),
        invoiceCount: 1,
      },
      {
        id: "noDueDate",
        amount: metric({ value: 200, unit: "VND" }),
        shareOfOutstanding: metric({ value: 11.11 }),
        invoiceCount: 1,
      },
    ],
    invoiceCount: 4,
    invoicesWithoutDueDate: 1,
    invoicesWithStatusPaymentMismatch: 1,
    unresolvedPaymentStatusCount: 0,
    overpaidInvoiceCount: 0,
    completeness: { sourceRowCounts: {}, unavailableMetrics: [], limitations: [] },
  },
});

const monthlySummary = {
  year: 2026,
  month: 11,
  totalRevenue: 1000,
  approvedExpenses: 400,
  maintenanceCost: 100,
  knownOperatingCost: 500,
  currency: "VND",
  knownOperatingCostAvailability: "AVAILABLE",
  knownOperatingCostAvailabilityReason: null,
  maintenanceCurrency: "VND",
  maintenanceCurrencyAvailability: "AVAILABLE",
  maintenanceCurrencyReason: null,
  mileage: {
    loadedMiles: 150,
    deadheadMiles: 50,
    totalMiles: 200,
    completedTripCount: 2,
    excludedTripCount: 0,
    availability: "AVAILABLE",
    reason: null,
    basis: "TRIPS_COMPLETED_AT_IN_PERIOD",
  },
};

describe("useExecutiveData activation", () => {
  beforeEach(() => {
    harness.queries = [];
    harness.customCalls = [];
    harness.canView = true;
    harness.responses = responses();
    harness.errors = {};
    harness.monthlyData = [];
    harness.providerCustom.mockReset();
  });

  it("requests each aggregate route with the exact backend parameters", () => {
    renderHook(() => useExecutiveData("longHaul", 3));

    const byUrl = (url: string) =>
      harness.customCalls.find((call) => call.url === url);

    expect(byUrl("/api/reports/executive-summary")?.method).toBe("get");
    expect(byUrl("/api/reports/executive-summary")?.config.query).toEqual({
      from: expect.stringMatching(/^\d{4}-\d{2}-01$/),
      to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });

    expect(byUrl("/api/reports/costs/by-category")?.config.query).toEqual({
      from: expect.any(String),
      to: expect.any(String),
      currency: "VND",
    });

    expect(
      byUrl("/api/reports/customers/concentration")?.config.query,
    ).toEqual({
      from: expect.any(String),
      to: expect.any(String),
      currency: "VND",
      limit: 10,
    });
    expect(harness.customCalls).toHaveLength(4);
    expect(byUrl("/api/reports/receivables/aging")?.config.query).toEqual({
      asOf: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      from: expect.any(String),
      to: expect.any(String),
      currency: "VND",
    });
  });

  it("requests one month per plan item and never a fleet-health route", () => {
    renderHook(() => useExecutiveData("longHaul", 6));

    expect(harness.queries).toHaveLength(6);
    expect(harness.queries.every((query) => query.enabled)).toBe(true);
    expect(
      harness.customCalls.some((call) =>
        call.url.includes("/api/reports/fleet/"),
      ),
    ).toBe(false);
  });

  it("maps summary, cost, concentration and aging responses", () => {
    const { result } = renderHook(() => useExecutiveData(null, 3));

    const kpi = (id: string) =>
      result.current.kpis.find((item) => item.definition.id === id);

    expect(kpi("fleetSize")?.current).toEqual({ status: "available", value: 12 });
    expect(kpi("activeCustomerCount")?.current).toEqual({
      status: "available",
      value: 7,
    });
    expect(kpi("loadedMiles")?.current).toEqual({
      status: "available",
      value: 75,
    });
    expect(kpi("onTimeDelivery")?.current).toEqual({
      status: "unavailable",
      reasonCode: "NO_DELIVERED_LOADS_IN_PERIOD",
    });
    expect(kpi("difot")?.current).toEqual({
      status: "unavailable",
      reasonCode: "DIFOT_NOT_DEFINED_IN_SYSTEM",
    });
    expect(kpi("dso")?.current).toEqual({ status: "available", value: 24.26 });
    expect(kpi("unplannedDowntime")?.current).toEqual({
      status: "unavailable",
      reasonCode: "NO_SOURCE_ROWS",
    });

    expect(result.current.costCategories?.[0]).toMatchObject({
      id: "FUEL",
      category: "FUEL",
      labelKey: "executive.costCategories.fuel",
      currentTotal: { status: "available", value: 100 },
      shareOfTotal: { status: "available", value: 62.5 },
      currentRowCount: 1,
    });

    expect(result.current.concentration?.top1Share).toEqual({
      status: "available",
      value: 61.9,
    });
    expect(result.current.concentration?.rows[1]).toMatchObject({
      customerName: null,
      revenue: { status: "available", value: 800 },
      revenuePerMile: {
        status: "unavailable",
        reasonCode: "NO_CUSTOMER_MILEAGE_ALLOCATION",
      },
      grossMarginPercent: {
        status: "unavailable",
        reasonCode: "NO_COST_ALLOCATION",
      },
    });

    expect(result.current.aging?.buckets.map((bucket) => bucket.labelKey)).toEqual([
      "executive.aging.current",
      "executive.aging.noDueDate",
    ]);
    expect(result.current.aging?.invoicesWithStatusPaymentMismatch).toBe(1);
  });

  it("maps monthly mileage into per-mile KPIs without using loaded miles as the denominator", () => {
    harness.monthlyData = [undefined, undefined, monthlySummary];
    const { result } = renderHook(() => useExecutiveData(null, 3));

    expect(result.current.monthlyPoints).not.toBeNull();
    expect(result.current.totalMiles).toEqual({
      status: "available",
      value: 200,
    });
    const kpi = (id: string) =>
      result.current.kpis.find((item) => item.definition.id === id);
    expect(kpi("revenuePerMile")?.current).toEqual({
      status: "available",
      value: 5,
    });
    expect(kpi("costPerMile")?.current).toEqual({
      status: "available",
      value: 2.5,
    });
  });

  it("sends the monthly request with year/month/currency and no from/to", async () => {
    renderHook(() => useExecutiveData(null, 1));
    harness.providerCustom.mockResolvedValue({ data: monthlySummary });

    await harness.queries[0].queryFn();

    expect(harness.providerCustom).toHaveBeenCalledWith({
      url: "/api/reports/financials/monthly",
      method: "get",
      query: {
        year: expect.any(Number),
        month: expect.any(Number),
        currency: "VND",
      },
    });
    const query = harness.providerCustom.mock.calls[0][0].query;
    expect(query).not.toHaveProperty("from");
    expect(query).not.toHaveProperty("to");
  });

  it("distinguishes a failed report request from an empty period", () => {
    harness.responses = {};
    harness.errors = {
      "/api/reports/costs/by-category": true,
      "/api/reports/customers/concentration": true,
      "/api/reports/receivables/aging": true,
    };
    const { result } = renderHook(() => useExecutiveData(null, 3));

    expect(result.current.costReasonKey).toBe(SECTION_REASONS.requestFailed);
    expect(result.current.concentrationReasonKey).toBe(
      SECTION_REASONS.requestFailed,
    );
    expect(result.current.agingReasonKey).toBe(SECTION_REASONS.requestFailed);
    expect(result.current.costCategories).toBeNull();
    expect(result.current.concentration).toBeNull();
    expect(result.current.aging).toBeNull();
  });

  it("issues no request and explains the missing permission when the role cannot read reports", () => {
    harness.canView = false;
    const { result } = renderHook(() => useExecutiveData(null, 3));

    expect(harness.customCalls.every((call) => call.queryOptions.enabled === false)).toBe(
      true,
    );
    expect(harness.queries.every((query) => query.enabled === false)).toBe(true);
    expect(result.current.monthlyReasonKey).toBe(SECTION_REASONS.forbidden);
    expect(result.current.concentrationReasonKey).toBe(
      SECTION_REASONS.forbidden,
    );
    expect(result.current.agingReasonKey).toBe(SECTION_REASONS.forbidden);
    expect(result.current.costReasonKey).toBe(SECTION_REASONS.forbidden);
  });
});
