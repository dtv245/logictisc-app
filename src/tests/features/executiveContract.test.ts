/**
 * Contract tests for the Executive reporting groundwork (BE-031).
 *
 * Verified against logictics_api on 2026-11-14:
 *   - four of the six aggregate routes do not exist;
 *   - monthly requires year/month and returns MonthlyFinancialSummary;
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
} from "@features/executive/utils/executive.metrics";
import {
  fleetPolicyId,
  fleetReport,
  fleetTruckId,
} from "@/tests/fixtures/fleet";
import type { FleetReport } from "@/types/fleet/fleetReport.dto";
import type { MonthlyFinancialSummary } from "@/types/reports/report.dto";

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
  ...changes,
});

describe("Executive endpoint contract registry", () => {
  it("keeps the feature dormant and records which routes exist", () => {
    expect(EXECUTIVE_CONTRACT_CONFIRMED).toBe(false);
    expect(EXECUTIVE_ENDPOINT_CONTRACT.executiveSummary.available).toBe(false);
    expect(EXECUTIVE_ENDPOINT_CONTRACT.costBreakdown.available).toBe(false);
    expect(
      EXECUTIVE_ENDPOINT_CONTRACT.customerConcentration.available,
    ).toBe(false);
    expect(EXECUTIVE_ENDPOINT_CONTRACT.receivablesAging.available).toBe(false);
    expect(EXECUTIVE_ENDPOINT_CONTRACT.monthlyFinancials.available).toBe(true);
    expect(EXECUTIVE_ENDPOINT_CONTRACT.fleetHealth.available).toBe(true);
  });

  it("disables every query while the feature is dormant, including existing routes", () => {
    const keys = Object.keys(
      EXECUTIVE_ENDPOINT_CONTRACT,
    ) as ExecutiveEndpointKey[];
    expect(keys).toHaveLength(6);
    for (const key of keys) {
      expect(isExecutiveEndpointQueryEnabled(key), key).toBe(false);
    }
  });
});

describe("monthly financial query plan (year/month, no from/to)", () => {
  it("walks back through a year boundary using UTC months", () => {
    const plan = buildMonthlyQueryPlan(new Date("2026-01-15T23:30:00Z"), 3);
    expect(plan).toEqual([
      {
        year: 2025,
        month: 11,
        monthKey: "2025-11",
        label: "11/2025",
      },
      {
        year: 2025,
        month: 12,
        monthKey: "2025-12",
        label: "12/2025",
      },
      {
        year: 2026,
        month: 1,
        monthKey: "2026-01",
        label: "01/2026",
      },
    ]);
  });

  it("caps the number of monthly requests", () => {
    const plan = buildMonthlyQueryPlan(new Date("2026-11-14T00:00:00Z"), 500);
    expect(plan).toHaveLength(MAX_MONTHLY_REPORT_REQUESTS);
    expect(plan.at(-1)?.monthKey).toBe("2026-11");
  });

  it("never produces an out-of-range month for a single-month window", () => {
    const plan = buildMonthlyQueryPlan(new Date("2026-12-31T18:00:00Z"), 1);
    expect(plan).toEqual([
      { year: 2026, month: 12, monthKey: "2026-12", label: "12/2026" },
    ]);
  });
});

describe("MonthlyFinancialSummary → chart point", () => {
  const planItem = { year: 2026, month: 3, monthKey: "2026-03", label: "03/2026" };

  it("reads totalRevenue and computes profit from complete operands", () => {
    const point = toMonthlyFinancialPoint(summary(), planItem);
    expect(point.revenue).toEqual({ status: "available", value: 1_000 });
    expect(point.operatingCost).toEqual({ status: "available", value: 500 });
    expect(point.operatingProfit).toEqual({ status: "available", value: 500 });
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

  it("marks every per-mile metric unavailable because the DTO has no miles", () => {
    const point = toMonthlyFinancialPoint(summary(), planItem);
    for (const metric of [
      point.revenuePerMile,
      point.costPerMile,
      point.contributionSpread,
      point.loadedMiles,
      point.totalMiles,
    ]) {
      expect(metric).toEqual({
        status: "unavailable",
        reasonCode: "NO_TOTAL_MILES_SOURCE",
      });
    }
    expect(point.closed).toBeNull();
    expect(point.invoiceCount).toBeNull();
  });

  it("fills a missing month with unavailable values, not zeros", () => {
    const point = emptyMonthlyFinancialPoint(planItem, "NO_SOURCE_ROWS");
    expect(point.month).toBe("2026-03");
    expect(point.revenue).toEqual({
      status: "unavailable",
      reasonCode: "NO_SOURCE_ROWS",
    });
    expect(point.operatingProfit.status).toBe("unavailable");
  });
});

describe("fleet health request requirements", () => {
  const dates = { firstDate: "2026-09-01", exclusiveLastDate: "2026-10-01" };

  it("refuses to build a query without a policy and verified truck ids", () => {
    expect(buildFleetHealthQuery(null, [fleetTruckId], dates)).toBeNull();
    expect(buildFleetHealthQuery(fleetPolicyId, [], dates)).toBeNull();
    expect(buildFleetHealthQuery(fleetPolicyId, ["not-a-uuid"], dates)).toBeNull();
    expect(
      buildFleetHealthQuery(fleetPolicyId, [fleetTruckId], {
        firstDate: "",
        exclusiveLastDate: "",
      }),
    ).toBeNull();
  });

  it("builds the documented year/month-free query with policyId and truckIds", () => {
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
    expect(query).not.toHaveProperty("to");
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
    expect(metrics.pmCompliance).toEqual({
      status: "unavailable",
      reasonCode: "HISTORICAL_PM_DUE_OCCURRENCES_UNAVAILABLE",
    });
    expect(metrics.maintenanceCostPerMile).toEqual({
      status: "unavailable",
      reasonCode: "COMPLETE_MAINTENANCE_COST_COVERAGE_UNAVAILABLE",
    });
    expect(metrics.breakdownsPer100k).toEqual({
      status: "unavailable",
      reasonCode: "BREAKDOWN_CLASSIFICATION_UNAVAILABLE",
    });
  });

  it("reads an AVAILABLE health metric by its documented code", () => {
    const report: FleetReport = {
      ...fleetReport,
      health: fleetReport.health.map((metric) =>
        metric.code === "PM_COMPLIANCE"
          ? {
              ...metric,
              availability: "AVAILABLE",
              value: "91.5",
              reason: null,
            }
          : metric,
      ),
    };

    const metrics = toFleetHealthMetrics(report);
    expect(metrics.pmCompliance).toEqual({
      status: "available",
      value: 91.5,
    });
    // The other KPIs keep their own reasons; nothing is borrowed.
    expect(metrics.unplannedDowntime.status).toBe("unavailable");
  });

  it("treats PARTIAL or a missing code as unavailable, never as the utilization metric", () => {
    const report: FleetReport = {
      ...fleetReport,
      health: [
        {
          code: "MAINTENANCE_COST_PER_MILE",
          value: "2.5",
          unit: "MONEY_PER_MILE",
          numerator: "1",
          denominator: "2",
          availability: "PARTIAL",
          basis: "X",
          reason: "INCOMPLETE_COVERAGE",
        },
      ],
    };

    const metrics = toFleetHealthMetrics(report);
    expect(metrics.maintenanceCostPerMile).toEqual({
      status: "unavailable",
      reasonCode: "INCOMPLETE_COVERAGE",
    });
    expect(metrics.unplannedDowntime).toEqual({
      status: "unavailable",
      reasonCode: "NOT_IMPLEMENTED",
    });
    // utilization is a different metric and must not stand in for any KPI.
    expect(
      Object.values(metrics).every((metric) => metric.status === "unavailable"),
    ).toBe(true);
  });

  it("reports no source rows when no request was made", () => {
    const metrics = toFleetHealthMetrics(null);
    expect(
      Object.values(metrics).every(
        (metric) =>
          metric.status === "unavailable" &&
          metric.reasonCode === "NO_SOURCE_ROWS",
      ),
    ).toBe(true);
  });
});

describe("metric definitions reflect the real endpoint surface", () => {
  const definitions = buildMetricDefinitions("longHaul");

  it("names the missing aggregate route for summary metrics", () => {
    const utilization = findMetric(definitions, "fleetUtilization");
    expect(utilization?.availability).toEqual({
      status: "unavailable",
      requiredEndpoint: "/api/reports/executive-summary",
      reasonKey: "executive.unavailable.noAggregateEndpoint",
    });
  });

  it("does not name a missing route for fleet-health metrics (the route exists)", () => {
    const downtime = findMetric(definitions, "unplannedDowntime");
    expect(downtime?.availability.status).toBe("unavailable");
    expect(
      downtime?.availability.status === "unavailable"
        ? downtime.availability.requiredEndpoint
        : undefined,
    ).toBeUndefined();
  });

  it("keeps the two CRUD-count metrics available because their counts are real", () => {
    expect(findMetric(definitions, "fleetSize")?.availability).toEqual({
      status: "available",
    });
    expect(findMetric(definitions, "activeCustomerCount")?.availability).toEqual(
      { status: "available" },
    );
  });
});
