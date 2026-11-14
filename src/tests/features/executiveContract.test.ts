/**
 * Contract tests for the Executive reporting data layer.
 *
 * Verified against `logictics_api` at `2328e76`:
 *   - all six aggregate routes exist;
 *   - monthly returns MonthlyFinancialSummary with the additive `mileage` field;
 *   - fleet health requires policyId/truckIds and returns FleetHistory.Report.
 */

import { describe, expect, it } from "vitest";

import {
  EXECUTIVE_CONTRACT_CONFIRMED,
  EXECUTIVE_ENDPOINT_CONTRACT,
  isExecutiveEndpointQueryEnabled,
  type ExecutiveEndpointKey,
} from "@features/executive/config/executive.contract";
import {
  buildReportWindow,
  toMetricValue,
  utcToday,
} from "@features/executive/api/executive.queries";
import {
  buildFleetHealthQuery,
  toFleetHealthMetrics,
} from "@features/executive/utils/executive.fleetHealth";
import {
  buildMonthlyQueryPlan,
  emptyMonthlyFinancialPoint,
  MAX_MONTHLY_REPORT_REQUESTS,
  toMonthlyFinancialPoint,
} from "@features/executive/utils/executive.monthly";
import {
  buildMetricDefinitions,
  findMetric,
  unavailableReasonKey,
} from "@features/executive/utils/executive.metrics";
import {
  fleetPolicyId,
  fleetReport,
  fleetTruckId,
} from "@/tests/fixtures/fleet";
import type { FleetReport } from "@/types/fleet/fleetReport.dto";
import type { MetricDto } from "@/types/reports/report.dto";
import type {
  MonthlyFinancialSummary,
  MonthlyMileageSummary,
} from "@/types/reports/report.dto";

const mileage = (
  changes: Partial<MonthlyMileageSummary> = {},
): MonthlyMileageSummary => ({
  loadedMiles: 150,
  deadheadMiles: 50,
  totalMiles: 200,
  completedTripCount: 2,
  excludedTripCount: 0,
  availability: "AVAILABLE",
  reason: null,
  basis: "TRIPS_COMPLETED_AT_IN_PERIOD",
  ...changes,
});

const summary = (
  changes: Partial<MonthlyFinancialSummary> = {},
): MonthlyFinancialSummary => ({
  year: 2026,
  month: 3,
  totalRevenue: 1_000,
  approvedExpenses: 400,
  maintenanceCost: 100,
  knownOperatingCost: 500,
  currency: "VND",
  knownOperatingCostAvailability: "AVAILABLE",
  knownOperatingCostAvailabilityReason: null,
  maintenanceCurrency: "VND",
  maintenanceCurrencyAvailability: "AVAILABLE",
  maintenanceCurrencyReason: null,
  mileage: mileage(),
  ...changes,
});

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

describe("Executive endpoint contract registry", () => {
  it("enables every route that exists in the backend controller", () => {
    expect(EXECUTIVE_CONTRACT_CONFIRMED).toBe(true);
    const keys = Object.keys(
      EXECUTIVE_ENDPOINT_CONTRACT,
    ) as ExecutiveEndpointKey[];
    expect(keys).toHaveLength(6);
    for (const key of keys) {
      expect(EXECUTIVE_ENDPOINT_CONTRACT[key].available, key).toBe(true);
      expect(isExecutiveEndpointQueryEnabled(key), key).toBe(true);
    }
  });
});

describe("report window", () => {
  it("sends inclusive calendar dates, UTC, aligned to whole months", () => {
    expect(buildReportWindow(new Date("2026-11-14T23:30:00Z"), 3)).toEqual({
      from: "2026-09-01",
      to: "2026-11-14",
    });
    expect(utcToday(new Date("2026-01-01T00:30:00Z"))).toBe("2026-01-01");
  });

  it("handles a year boundary and clamps the range", () => {
    expect(buildReportWindow(new Date("2026-01-15T00:00:00Z"), 2)).toEqual({
      from: "2025-12-01",
      to: "2026-01-15",
    });
    expect(buildReportWindow(new Date("2026-01-15T00:00:00Z"), 500).from).toBe(
      "2024-02-01",
    );
  });
});

describe("monthly financial query plan (year/month, no from/to)", () => {
  it("walks back through a year boundary using UTC months", () => {
    const plan = buildMonthlyQueryPlan(new Date("2026-01-15T23:30:00Z"), 3);
    expect(plan).toEqual([
      { year: 2025, month: 11, monthKey: "2025-11", label: "11/2025" },
      { year: 2025, month: 12, monthKey: "2025-12", label: "12/2025" },
      { year: 2026, month: 1, monthKey: "2026-01", label: "01/2026" },
    ]);
  });

  it("caps the number of monthly requests", () => {
    const plan = buildMonthlyQueryPlan(new Date("2026-11-14T00:00:00Z"), 500);
    expect(plan).toHaveLength(MAX_MONTHLY_REPORT_REQUESTS);
    expect(plan.at(-1)?.monthKey).toBe("2026-11");
  });
});

describe("MetricDto → MetricValue", () => {
  it("reads AVAILABLE and PARTIAL values, and never turns null into zero", () => {
    expect(toMetricValue(metric())).toEqual({ status: "available", value: 10 });
    expect(toMetricValue(metric({ availability: "PARTIAL" }))).toEqual({
      status: "available",
      value: 10,
    });
    expect(toMetricValue(metric({ value: null }))).toEqual({
      status: "unavailable",
      reasonCode: null,
    });
    expect(
      toMetricValue(
        metric({
          availability: "UNAVAILABLE",
          value: null,
          reason: "NO_DELIVERED_LOADS_IN_PERIOD",
        }),
      ),
    ).toEqual({
      status: "unavailable",
      reasonCode: "NO_DELIVERED_LOADS_IN_PERIOD",
    });
    expect(toMetricValue(undefined)).toEqual({
      status: "unavailable",
      reasonCode: "NO_SOURCE_ROWS",
    });
  });

  it("maps the new backend reason codes to locale keys", () => {
    expect(unavailableReasonKey("NO_VEHICLE_AVAILABILITY_HISTORY")).toBe(
      "executive.unavailable.reason.noVehicleAvailabilityHistory",
    );
    expect(unavailableReasonKey("DIFOT_NOT_DEFINED_IN_SYSTEM")).toBe(
      "executive.unavailable.reason.difotNotDefined",
    );
    expect(unavailableReasonKey("NON_POSITIVE_ATTRIBUTED_REVENUE")).toBe(
      "executive.unavailable.reason.nonPositiveAttributedRevenue",
    );
  });
});

describe("MonthlyFinancialSummary → chart point", () => {
  const planItem = { year: 2026, month: 3, monthKey: "2026-03", label: "03/2026" };

  it("computes revenue, cost, profit and per-mile KPIs from complete operands", () => {
    const point = toMonthlyFinancialPoint(summary(), planItem);
    expect(point.revenue).toEqual({ status: "available", value: 1_000 });
    expect(point.operatingCost).toEqual({ status: "available", value: 500 });
    expect(point.operatingProfit).toEqual({ status: "available", value: 500 });
    expect(point.loadedMiles).toEqual({ status: "available", value: 150 });
    expect(point.totalMiles).toEqual({ status: "available", value: 200 });
    expect(point.revenuePerMile).toEqual({ status: "available", value: 5 });
    expect(point.costPerMile).toEqual({ status: "available", value: 2.5 });
    expect(point.contributionSpread).toEqual({
      status: "available",
      value: 2.5,
    });
  });

  it("keeps a PARTIAL operating cost unavailable instead of presenting it as complete", () => {
    const point = toMonthlyFinancialPoint(
      summary({
        knownOperatingCostAvailability: "PARTIAL",
        knownOperatingCostAvailabilityReason:
          "DUPLICATE_SOURCE_NOT_FULLY_RECONCILED",
      }),
      planItem,
    );

    expect(point.revenue).toEqual({ status: "available", value: 1_000 });
    expect(point.operatingCost).toEqual({
      status: "unavailable",
      reasonCode: "DUPLICATE_SOURCE_NOT_FULLY_RECONCILED",
    });
    expect(point.operatingProfit.status).toBe("unavailable");
    expect(point.costPerMile.status).toBe("unavailable");
    expect(point.contributionSpread.status).toBe("unavailable");
    // Revenue per mile does not depend on the incomplete cost.
    expect(point.revenuePerMile).toEqual({ status: "available", value: 5 });
  });

  it("refuses per-mile ratios when mileage is PARTIAL", () => {
    const point = toMonthlyFinancialPoint(
      summary({
        mileage: mileage({
          availability: "PARTIAL",
          reason: "TRIPS_MISSING_OR_INCONSISTENT_MILEAGE",
          excludedTripCount: 1,
        }),
      }),
      planItem,
    );
    expect(point.totalMiles).toEqual({
      status: "unavailable",
      reasonCode: "TRIPS_MISSING_OR_INCONSISTENT_MILEAGE",
    });
    expect(point.revenuePerMile).toEqual({
      status: "unavailable",
      reasonCode: "TRIPS_MISSING_OR_INCONSISTENT_MILEAGE",
    });
  });

  it("never replaces a zero denominator with a number", () => {
    const point = toMonthlyFinancialPoint(
      summary({ mileage: mileage({ totalMiles: 0 }) }),
      planItem,
    );
    expect(point.totalMiles).toEqual({ status: "available", value: 0 });
    expect(point.revenuePerMile).toEqual({
      status: "unavailable",
      reasonCode: "ZERO_DENOMINATOR",
    });
  });

  it("reports no mileage when the month has no completed trips", () => {
    const point = toMonthlyFinancialPoint(
      summary({ mileage: null }),
      planItem,
    );
    expect(point.loadedMiles).toEqual({
      status: "unavailable",
      reasonCode: "NO_COMPLETED_TRIPS_IN_PERIOD",
    });
  });

  it("never turns a null revenue or cost into zero", () => {
    const point = toMonthlyFinancialPoint(
      summary({ totalRevenue: null, knownOperatingCost: null }),
      planItem,
    );
    expect(point.revenue.status).toBe("unavailable");
    expect(point.operatingCost.status).toBe("unavailable");
    expect(point.operatingProfit.status).toBe("unavailable");
  });

  it("fills a missing month with unavailable values, not zeros", () => {
    const point = emptyMonthlyFinancialPoint(planItem, "NO_SOURCE_ROWS");
    expect(point.month).toBe("2026-03");
    expect(point.revenue).toEqual({
      status: "unavailable",
      reasonCode: "NO_SOURCE_ROWS",
    });
    expect(point.totalMiles.status).toBe("unavailable");
  });
});

describe("fleet health request requirements", () => {
  const dates = { firstDate: "2026-09-01", exclusiveLastDate: "2026-10-01" };

  it("refuses to build a query without a policy and verified truck ids", () => {
    expect(buildFleetHealthQuery(null, [fleetTruckId], dates)).toBeNull();
    expect(buildFleetHealthQuery(fleetPolicyId, [], dates)).toBeNull();
    expect(buildFleetHealthQuery(fleetPolicyId, ["not-a-uuid"], dates)).toBeNull();
  });

  it("builds the documented query with policyId and truckIds only", () => {
    const query = buildFleetHealthQuery(
      fleetPolicyId,
      [fleetTruckId, fleetTruckId],
      dates,
      "Asia/Ho_Chi_Minh",
    );

    expect(query).toEqual({
      policyId: fleetPolicyId,
      truckIds: fleetTruckId,
      firstDate: dates.firstDate,
      exclusiveLastDate: dates.exclusiveLastDate,
      businessZoneId: "Asia/Ho_Chi_Minh",
    });
    expect(query).not.toHaveProperty("from");
    expect(query).not.toHaveProperty("currency");
  });
});

describe("FleetHistory.Report → Executive fleet-health KPIs", () => {
  it("keeps backend unavailable reasons instead of inventing numbers", () => {
    const metrics = toFleetHealthMetrics(fleetReport);
    expect(metrics.unplannedDowntime).toEqual({
      status: "unavailable",
      reasonCode: "DOWNTIME_INTERVAL_SOURCE_UNAVAILABLE",
    });
    expect(metrics.breakdownsPer100k).toEqual({
      status: "unavailable",
      reasonCode: "BREAKDOWN_CLASSIFICATION_UNAVAILABLE",
    });
  });

  it("reads an AVAILABLE health metric by its documented code", () => {
    const report: FleetReport = {
      ...fleetReport,
      health: fleetReport.health.map((entry) =>
        entry.code === "PM_COMPLIANCE"
          ? { ...entry, availability: "AVAILABLE", value: "91.5", reason: null }
          : entry,
      ),
    };
    expect(toFleetHealthMetrics(report).pmCompliance).toEqual({
      status: "available",
      value: 91.5,
    });
  });

  it("reports no source rows when no request was made", () => {
    const metrics = toFleetHealthMetrics(null);
    expect(
      Object.values(metrics).every(
        (value) =>
          value.status === "unavailable" &&
          value.reasonCode === "NO_SOURCE_ROWS",
      ),
    ).toBe(true);
  });
});

describe("metric definitions reflect the verified endpoint surface", () => {
  const definitions = buildMetricDefinitions("longHaul");

  it("declares every sourced KPI available", () => {
    for (const id of [
      "fleetUtilization",
      "loadedMiles",
      "onTimeDelivery",
      "difot",
      "costPerMile",
      "revenuePerMile",
      "contributionSpread",
      "dso",
      "unplannedDowntime",
      "pmCompliance",
      "maintenanceCostPerMile",
      "breakdownsPer100k",
      "fleetSize",
      "activeCustomerCount",
    ]) {
      expect(findMetric(definitions, id)?.availability, id).toEqual({
        status: "available",
      });
    }
  });

  it("keeps metrics with no backend source out of the contract", () => {
    for (const id of ["operatingMargin", "revenueGrowth"]) {
      const availability = findMetric(definitions, id)?.availability;
      expect(availability?.status, id).toBe("unavailable");
      expect(
        availability?.status === "unavailable"
          ? availability.requiredEndpoint
          : undefined,
      ).toBeUndefined();
    }
  });
});
