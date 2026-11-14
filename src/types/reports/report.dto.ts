/**
 * Wire DTOs for the reporting routes Executive relies on.
 *
 * These mirror the Java records exactly. They are deliberately NOT shaped like
 * a frontend display model and they are NOT interchangeable between routes:
 * `MonthlyFinancialSummary` is one month's accounting summary, while
 * `FleetHistory.Report` is an explicitly scoped fleet-health report. Treating
 * them as the same DTO, or composing them into "company-wide" numbers, would
 * put figures on an executive screen that no backend report produced.
 *
 * The previous `ExecutiveSummaryDto` / `CostBreakdownDto` / `FleetHealthDto` /
 * `CustomerConcentrationDto` / `ReceivablesAgingDto` declarations were removed:
 * none of those routes exists in `logictics_api` (see
 * `features/executive/config/executive.contract.ts` and BE-031 in
 * docs/backend-gaps.md).
 */

import type { FleetReport } from "@/types/fleet/fleetReport.dto";

/** Mirrors `com.company.logicstic.common.MetricAvailability`. */
export type MetricAvailability =
  | "AVAILABLE"
  | "PARTIAL"
  | "UNAVAILABLE"
  | "NOT_APPLICABLE";

/**
 * Mirrors
 * `com.company.logicstic.dto.report.MonthlyFinancialSummary` (12 components).
 *
 * `knownOperatingCost` is only meaningful when
 * `knownOperatingCostAvailability === "AVAILABLE"`; the controller currently
 * always reports `PARTIAL` because expenses and maintenance are not fully
 * reconciled. Treating a `PARTIAL` value as a complete operating cost would
 * understate or overstate the figure.
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
}

/**
 * The response of GET `/api/reports/fleet/health`.
 *
 * Re-exported under an explicit name so no caller can mistake it for the old,
 * non-existent `FleetHealthDto` with its `unplannedDowntimePct` family.
 */
export type FleetHistoryReport = FleetReport;
