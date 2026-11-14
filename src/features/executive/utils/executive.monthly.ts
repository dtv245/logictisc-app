/**
 * Request plan and response mapping for GET `/api/reports/financials/monthly`.
 *
 * The backend contract is `year` + `month` (+ optional `currency`) and it
 * returns ONE `MonthlyFinancialSummary`. The previous Executive query sent a
 * `from`/`to` window and read `response.points[]`; neither exists on the wire.
 * Chart points are therefore built by calling the endpoint once per month and
 * mapping each response individually.
 *
 * Anything the summary does not carry stays unavailable. In particular the
 * monthly DTO has no miles field, so every per-mile metric is unavailable with
 * `NO_TOTAL_MILES_SOURCE` — never divided by an invented denominator.
 */

import type { MetricValue, MonthlyFinancialPoint } from "@/types/executive/executive.types";
import type { MonthlyFinancialSummary } from "@/types/reports/report.dto";
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
 * `operatingCost` is only read when the backend says it is `AVAILABLE`.
 * The controller currently reports `PARTIAL`, so the value is present on the
 * wire but incomplete; showing it as total operating cost would present an
 * understated figure as complete.
 *
 * Profit uses the same confirmed formula as the operations dashboard
 * (`calculateProfit`) and only runs when both operands are complete.
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

  // The monthly DTO carries no mileage at all.
  const noMileage = unavailable("NO_TOTAL_MILES_SOURCE");

  return {
    month: planItem.monthKey,
    label: planItem.label,
    revenue,
    operatingCost,
    operatingProfit,
    revenuePerMile: noMileage,
    costPerMile: noMileage,
    contributionSpread: noMileage,
    loadedMiles: noMileage,
    totalMiles: noMileage,
    // No accounting-period table exists, so "closed" cannot be known.
    closed: null,
    invoiceCount: null,
  };
};
