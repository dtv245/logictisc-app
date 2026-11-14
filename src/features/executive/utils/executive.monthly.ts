/**
 * Request plan and response mapping for GET `/api/reports/financials/monthly`.
 *
 * Backend contract (verified at `logictics_api` `2328e76`):
 *   - request: `year` + `month` (+ optional `currency`);
 *   - response: ONE `MonthlyFinancialSummary` per call, now with an additive
 *     `mileage` object (BE-033) sourced from completed trips' mileage columns.
 *
 * Chart points are therefore built by calling the endpoint once per month and
 * mapping each response individually.
 *
 * Per-mile rules:
 *   - `totalMiles` is the only denominator used. `loadedMiles` is never a
 *     substitute for total miles.
 *   - Revenue per mile is computed only when revenue and `totalMiles` are both
 *     complete (`mileage.availability === "AVAILABLE"`). `PARTIAL` mileage means
 *     a known subset of trips was excluded, so a per-mile ratio would be
 *     understated — those months stay unavailable with the backend reason.
 *   - Cost per mile additionally requires a complete operating cost. The
 *     backend reports `knownOperatingCostAvailability = PARTIAL`, so this stays
 *     unavailable until the cost sources reconcile.
 *   - A zero denominator is `ZERO_DENOMINATOR`, never `Infinity` or 0.
 */

import type { MetricValue, MonthlyFinancialPoint } from "@/types/executive/executive.types";
import type {
  MonthlyFinancialSummary,
  MonthlyMileageSummary,
} from "@/types/reports/report.dto";
import { calculateProfit } from "@/utils/calculations";

/**
 * Hard cap on the number of monthly requests one screen may issue.
 *
 * The endpoint accepts exactly one month per call, so a "24 months" filter is
 * 24 requests. The cap keeps a mistyped or future range from fanning out
 * unbounded calls; `RANGE_MONTH_CHOICES` already tops out at 24.
 */
export const MAX_MONTHLY_REPORT_REQUESTS = 24;

export interface MonthlyQueryPlanItem {
  readonly year: number;
  /** 1-based month, exactly as the backend expects. */
  readonly month: number;
  /** Stable chart/cache key, `yyyy-MM`. */
  readonly monthKey: string;
  /** Locale-neutral label, `MM/yyyy` (same shape the dashboard uses). */
  readonly label: string;
}

const pad2 = (value: number): string => String(value).padStart(2, "0");

/**
 * Last `rangeMonths` calendar months ending at the month that contains `now`,
 * oldest first. Arithmetic is UTC-only so a client in UTC+7 cannot land on the
 * previous month at the boundary and request a different year than intended.
 */
export const buildMonthlyQueryPlan = (
  now: Date,
  rangeMonths: number,
): MonthlyQueryPlanItem[] => {
  const months = Number.isFinite(rangeMonths)
    ? Math.min(
        MAX_MONTHLY_REPORT_REQUESTS,
        Math.max(1, Math.trunc(rangeMonths)),
      )
    : 1;
  const plan: MonthlyQueryPlanItem[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    );
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    plan.push({
      year,
      month,
      monthKey: `${year}-${pad2(month)}`,
      label: `${pad2(month)}/${year}`,
    });
  }

  return plan;
};

const unavailable = (reasonCode: string | null): MetricValue => ({
  status: "unavailable",
  reasonCode,
});

const finiteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Metric from a nullable wire number; never turns a missing value into 0. */
export const toWireMetric = (
  value: unknown,
  reasonCode: string | null = null,
): MetricValue => {
  const numeric = finiteNumber(value);
  return numeric === null ? unavailable(reasonCode) : { status: "available", value: numeric };
};

/**
 * One mileage column, gated on complete mileage.
 *
 * `PARTIAL` mileage is a real measurement over a known subset of trips; using
 * it as a denominator would silently change the meaning of every per-mile KPI.
 */
const toMileageMetric = (
  mileage: MonthlyMileageSummary | null,
  pick: (value: MonthlyMileageSummary) => number | null,
): MetricValue => {
  if (!mileage) return unavailable("NO_COMPLETED_TRIPS_IN_PERIOD");
  if (mileage.availability !== "AVAILABLE") {
    return unavailable(mileage.reason ?? "NO_VALID_TRIP_MILEAGE_ROWS");
  }
  return toWireMetric(pick(mileage), "NO_VALID_TRIP_MILEAGE_ROWS");
};

/** Ratio metric that refuses to divide by a missing/zero denominator. */
const ratioMetric = (
  numerator: MetricValue,
  denominator: MetricValue,
): MetricValue => {
  if (numerator.status === "unavailable") return numerator;
  if (denominator.status === "unavailable") return denominator;
  if (denominator.value === 0) return unavailable("ZERO_DENOMINATOR");
  return { status: "available", value: numerator.value / denominator.value };
};

/**
 * Một tháng không có response (lỗi request hoặc chưa từng chạy).
 *
 * Giữ chỗ trên trục thời gian nhưng mọi chỉ số đều "chưa có số": bỏ tháng khỏi
 * chuỗi sẽ khiến một tháng mất dữ liệu trông giống một tháng không tồn tại.
 */
export const emptyMonthlyFinancialPoint = (
  planItem: Pick<MonthlyQueryPlanItem, "year" | "month" | "monthKey" | "label">,
  reasonCode: string | null,
): MonthlyFinancialPoint => {
  const metric = unavailable(reasonCode);
  return {
    month: planItem.monthKey,
    label: planItem.label,
    revenue: metric,
    operatingCost: metric,
    operatingProfit: metric,
    revenuePerMile: metric,
    costPerMile: metric,
    contributionSpread: metric,
    loadedMiles: metric,
    totalMiles: metric,
    closed: null,
    invoiceCount: null,
  };
};

/**
 * Map one monthly summary to one chart point.
 *
 * `operatingCost` is only read when the backend says it is `AVAILABLE`. The
 * controller currently reports `PARTIAL`, so the value on the wire is
 * incomplete; showing it as total operating cost would present an understated
 * figure as complete. Profit uses the same confirmed formula as the operations
 * dashboard (`calculateProfit`) and only runs when both operands are complete.
 */
export const toMonthlyFinancialPoint = (
  summary: MonthlyFinancialSummary,
  planItem: Pick<MonthlyQueryPlanItem, "year" | "month" | "monthKey" | "label">,
): MonthlyFinancialPoint => {
  const revenue = toWireMetric(summary.totalRevenue, "NO_SOURCE_ROWS");

  const operatingCost: MetricValue =
    summary.knownOperatingCostAvailability === "AVAILABLE"
      ? toWireMetric(
          summary.knownOperatingCost,
          summary.knownOperatingCostAvailabilityReason ?? "NOT_IMPLEMENTED",
        )
      : unavailable(
          summary.knownOperatingCostAvailabilityReason ?? "NOT_IMPLEMENTED",
        );

  const operatingProfit: MetricValue =
    revenue.status === "available" && operatingCost.status === "available"
      ? {
          status: "available",
          value: calculateProfit(revenue.value, operatingCost.value).profit,
        }
      : unavailable(
          revenue.status === "unavailable"
            ? revenue.reasonCode
            : operatingCost.status === "unavailable"
              ? operatingCost.reasonCode
              : null,
        );

  const loadedMiles = toMileageMetric(summary.mileage, (m) => m.loadedMiles);
  const totalMiles = toMileageMetric(summary.mileage, (m) => m.totalMiles);

  const revenuePerMile = ratioMetric(revenue, totalMiles);
  const costPerMile = ratioMetric(operatingCost, totalMiles);
  const contributionSpread: MetricValue =
    revenuePerMile.status === "available" && costPerMile.status === "available"
      ? {
          status: "available",
          value: revenuePerMile.value - costPerMile.value,
        }
      : unavailable(
          revenuePerMile.status === "unavailable"
            ? revenuePerMile.reasonCode
            : costPerMile.status === "unavailable"
              ? costPerMile.reasonCode
              : null,
        );

  return {
    month: planItem.monthKey,
    label: planItem.label,
    revenue,
    operatingCost,
    operatingProfit,
    revenuePerMile,
    costPerMile,
    contributionSpread,
    loadedMiles,
    totalMiles,
    // No accounting-period table exists, so "closed" cannot be known.
    closed: null,
    invoiceCount: null,
  };
};
