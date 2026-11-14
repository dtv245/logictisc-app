/**
 * Wire DTOs for the reporting routes Executive consumes.
 *
 * These mirror the Java records in `logictics_api`
 * (`src/main/java/com/company/logicstic/dto/report/**`) field-for-field. They
 * are deliberately NOT shaped like a frontend display model: the conversion to
 * `MetricValue` lives in the feature layer, and a missing/partial value is never
 * turned into zero there.
 *
 * Backend commit: `2328e76` (handoff `docs/contracts/backend-frontend-unblock-handoff.md`).
 */

import type { FleetReport } from "@/types/fleet/fleetReport.dto";

/** Mirrors `com.company.logicstic.common.MetricAvailability`. */
export type MetricAvailability =
  | "AVAILABLE"
  | "PARTIAL"
  | "UNAVAILABLE"
  | "NOT_APPLICABLE";

/**
 * Mirrors `com.company.logicstic.common.MetricDto`.
 *
 * `value` is null whenever the metric is not trustworthy. `PARTIAL` means the
 * value is real but a known subset was excluded; `reason` names it.
 */
export interface MetricDto {
  readonly code: string;
  readonly value: number | null;
  readonly unit: string | null;
  readonly numerator: number | null;
  readonly denominator: number | null;
  readonly availability: MetricAvailability;
  readonly basis: string | null;
  readonly reason: string | null;
}

/** Mirrors `ReportPeriodDto`. Dates are inclusive `yyyy-MM-dd`. */
export interface ReportPeriodDto {
  readonly from: string;
  readonly to: string;
}

/** Mirrors `ReportCompleteness`. */
export interface ReportCompleteness {
  readonly sourceRowCounts: Readonly<Record<string, number>>;
  readonly unavailableMetrics: readonly string[];
  readonly limitations: readonly string[];
}

/** Mirrors `ExecutiveSummaryReport` — `GET /api/reports/executive-summary`. */
export interface ExecutiveSummaryReport {
  readonly period: ReportPeriodDto;
  readonly generatedAt: string;
  readonly fleetSize: MetricDto;
  readonly activeCustomers: MetricDto;
  readonly onTimeDeliveryPct: MetricDto;
  readonly trucksWithLoadsPct: MetricDto;
  readonly loadedMilesPct: MetricDto;
  readonly fleetUtilizationPct: MetricDto;
  readonly difotPct: MetricDto;
  readonly completeness: ReportCompleteness;
}

/** Mirrors `CostBreakdownReport.CostCategoryItem`. */
export interface CostCategoryItemDto {
  readonly category: string;
  readonly currentTotal: MetricDto;
  readonly previousTotal: MetricDto;
  readonly shareOfTotal: MetricDto;
  readonly currentRowCount: number;
  readonly previousRowCount: number;
}

/** Mirrors `CostBreakdownReport` — `GET /api/reports/costs/by-category`. */
export interface CostBreakdownReport {
  readonly currency: string;
  readonly period: ReportPeriodDto;
  readonly previousPeriod: ReportPeriodDto;
  readonly totalCost: MetricDto;
  readonly maintenanceCost: MetricDto;
  readonly maintenanceRecordCount: number;
  readonly ambiguousTruckLinkCount: number;
  readonly categories: readonly CostCategoryItemDto[];
  readonly completeness: ReportCompleteness;
}

/** Mirrors `CustomerConcentrationReport.CustomerConcentrationRow`. */
export interface CustomerConcentrationRowDto {
  readonly customerId: string;
  readonly customerName: string | null;
  readonly revenue: MetricDto;
  readonly shareOfRevenue: MetricDto;
  readonly invoiceCount: number;
}

/** Mirrors `CustomerConcentrationReport` — `GET /api/reports/customers/concentration`. */
export interface CustomerConcentrationReport {
  readonly currency: string;
  readonly period: ReportPeriodDto;
  readonly totalRevenue: MetricDto;
  readonly attributedRevenue: MetricDto;
  readonly unlinkedRevenue: MetricDto;
  readonly top1Share: MetricDto;
  readonly top3Share: MetricDto;
  readonly top5Share: MetricDto;
  readonly hhi: MetricDto;
  readonly customersConsidered: number;
  readonly customersReturned: number;
  readonly customersWithoutRevenue: number;
  readonly invoicesWithoutCustomer: number;
  readonly limit: number;
  readonly rows: readonly CustomerConcentrationRowDto[];
  readonly completeness: ReportCompleteness;
}

/** Mirrors `ReceivablesAgingReport.AgingBucket`. */
export interface AgingBucketDto {
  readonly id: string;
  readonly amount: MetricDto;
  readonly shareOfOutstanding: MetricDto;
  readonly invoiceCount: number;
}

/** Mirrors `ReceivablesAgingReport` — `GET /api/reports/receivables/aging`. */
export interface ReceivablesAgingReport {
  readonly currency: string;
  readonly asOf: string;
  readonly revenueWindow: ReportPeriodDto | null;
  readonly outstandingTotal: MetricDto;
  readonly overdueTotal: MetricDto;
  readonly dsoDays: MetricDto;
  readonly buckets: readonly AgingBucketDto[];
  readonly invoiceCount: number;
  readonly invoicesWithoutDueDate: number;
  readonly invoicesWithStatusPaymentMismatch: number;
  readonly unresolvedPaymentStatusCount: number;
  readonly overpaidInvoiceCount: number;
  readonly completeness: ReportCompleteness;
}

/** Mirrors `MonthlyMileageSummary` (BE-033). */
export interface MonthlyMileageSummary {
  readonly loadedMiles: number | null;
  readonly deadheadMiles: number | null;
  readonly totalMiles: number | null;
  readonly completedTripCount: number;
  readonly excludedTripCount: number;
  readonly availability: MetricAvailability;
  readonly reason: string | null;
  readonly basis: string;
}

/**
 * Mirrors `MonthlyFinancialSummary` (13 components after BE-033).
 *
 * `knownOperatingCost` is only complete when
 * `knownOperatingCostAvailability === "AVAILABLE"`; the controller reports
 * `PARTIAL` because expenses and maintenance are not fully reconciled.
 */
export interface MonthlyFinancialSummary {
  readonly year: number;
  readonly month: number;
  readonly totalRevenue: number | null;
  readonly approvedExpenses: number | null;
  readonly maintenanceCost: number | null;
  readonly knownOperatingCost: number | null;
  readonly currency: string | null;
  readonly knownOperatingCostAvailability: MetricAvailability | null;
  readonly knownOperatingCostAvailabilityReason: string | null;
  readonly maintenanceCurrency: string | null;
  readonly maintenanceCurrencyAvailability: MetricAvailability | null;
  readonly maintenanceCurrencyReason: string | null;
  readonly mileage: MonthlyMileageSummary | null;
}

/**
 * The response of GET `/api/reports/fleet/health`.
 *
 * Re-exported under an explicit name so no caller mistakes it for the removed
 * `FleetHealthDto`; it is a different record with a required policy/truck scope.
 */
export type FleetHistoryReport = FleetReport;
