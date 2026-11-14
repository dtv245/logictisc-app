/**
 * GET `/api/reports/fleet/health` — request requirements and response mapping.
 *
 * The backend (`ReportController.getFleetHistory`) REQUIRES `policyId` (UUID)
 * and `truckIds` (List<UUID>). It returns `FleetHistory.Report`, a different
 * record from the old Executive `FleetHealthDto`:
 *
 *   Report { utilization, loadedMilesPercent, deadheadPercent,
 *            health: MetricDto[], coverage[], ... }
 *
 * The four Executive fleet-health KPIs live in `health[]` as `MetricDto`
 * entries addressed by `code` (confirmed by the backend fixture corpus):
 *   UNPLANNED_DOWNTIME          → unplannedDowntime
 *   PM_COMPLIANCE               → pmCompliance
 *   MAINTENANCE_COST_PER_MILE   → maintenanceCostPerMile
 *   BREAKDOWNS_PER_100K_MILES   → breakdownsPer100k
 *
 * Mapping rules:
 *   - Only an entry with `availability === "AVAILABLE"` and a finite numeric
 *     `value` produces a number. `PARTIAL` is incomplete, so it is unavailable.
 *   - An unavailable entry keeps the backend `reason`.
 *   - A missing code is unavailable (`NOT_IMPLEMENTED`). The adapter never
 *     substitutes `utilization` / `loadedMilesPercent` / `deadheadPercent`,
 *     which measure something else.
 *
 * Requirements on the request: without a verified policy id and at least one
 * verified truck id there is no request to make. The Executive screen has no
 * such selection, so the query stays disabled there; the Fleet Report page owns
 * the verified request path.
 */

import type { MetricValue } from "@/types/executive/executive.types";
import type {
  FleetMetric,
  FleetReport,
  FleetReportQuery,
} from "@/types/fleet/fleetReport.dto";

const FLEET_HEALTH_METRIC_IDS = [
  "unplannedDowntime",
  "pmCompliance",
  "maintenanceCostPerMile",
  "breakdownsPer100k",
] as const;

export type FleetHealthMetricId = (typeof FLEET_HEALTH_METRIC_IDS)[number];

/** Backend `MetricDto.code` for each Executive KPI. */
export const FLEET_HEALTH_METRIC_CODES: Record<FleetHealthMetricId, string> = {
  unplannedDowntime: "UNPLANNED_DOWNTIME",
  pmCompliance: "PM_COMPLIANCE",
  maintenanceCostPerMile: "MAINTENANCE_COST_PER_MILE",
  breakdownsPer100k: "BREAKDOWNS_PER_100K_MILES",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string | null | undefined): boolean =>
  typeof value === "string" && UUID_PATTERN.test(value.trim());

/**
 * Build the backend query only from verified identifiers.
 *
 * `truckIds` must be a non-empty list of UUIDs. A request with an empty list is
 * a guaranteed 400, and the screen does not retry on 400.
 */
export const buildFleetHealthQuery = (
  policyId: string | null | undefined,
  truckIds: readonly string[] | null | undefined,
  dates: { firstDate: string; exclusiveLastDate: string },
  businessZoneId?: string | null,
): FleetReportQuery | null => {
  const trimmedPolicyId = policyId?.trim();
  const validTrucks = [
    ...new Set(
      (truckIds ?? []).map((id) => id.trim()).filter((id) => isUuid(id)),
    ),
  ];

  if (!isUuid(trimmedPolicyId) || validTrucks.length === 0) return null;
  if (!dates.firstDate || !dates.exclusiveLastDate) return null;

  return {
    policyId: trimmedPolicyId as string,
    truckIds: validTrucks.join(","),
    firstDate: dates.firstDate,
    exclusiveLastDate: dates.exclusiveLastDate,
    businessZoneId: businessZoneId?.trim() ?? "",
  };
};

const toMetricValue = (metric: FleetMetric | undefined): MetricValue => {
  if (!metric) {
    return { status: "unavailable", reasonCode: "NOT_IMPLEMENTED" };
  }

  if (metric.availability !== "AVAILABLE") {
    return {
      status: "unavailable",
      reasonCode: metric.reason ?? "NOT_IMPLEMENTED",
    };
  }

  const numeric =
    typeof metric.value === "number"
      ? metric.value
      : typeof metric.value === "string" && metric.value.trim() !== ""
        ? Number(metric.value)
        : Number.NaN;

  return Number.isFinite(numeric)
    ? { status: "available", value: numeric }
    : { status: "unavailable", reasonCode: metric.reason ?? "NOT_IMPLEMENTED" };
};

/**
 * FleetHistory.Report → Executive KPI readings.
 *
 * A null report (no request issued) yields all-unavailable with
 * `NO_SOURCE_ROWS` — there is no data because nothing was measured, not because
 * the metric is zero.
 */
export const toFleetHealthMetrics = (
  report: FleetReport | null,
): Record<FleetHealthMetricId, MetricValue> => {
  if (!report) {
    return {
      unplannedDowntime: { status: "unavailable", reasonCode: "NO_SOURCE_ROWS" },
      pmCompliance: { status: "unavailable", reasonCode: "NO_SOURCE_ROWS" },
      maintenanceCostPerMile: {
        status: "unavailable",
        reasonCode: "NO_SOURCE_ROWS",
      },
      breakdownsPer100k: { status: "unavailable", reasonCode: "NO_SOURCE_ROWS" },
    };
  }

  const byCode = new Map(report.health.map((metric) => [metric.code, metric]));

  return {
    unplannedDowntime: toMetricValue(
      byCode.get(FLEET_HEALTH_METRIC_CODES.unplannedDowntime),
    ),
    pmCompliance: toMetricValue(
      byCode.get(FLEET_HEALTH_METRIC_CODES.pmCompliance),
    ),
    maintenanceCostPerMile: toMetricValue(
      byCode.get(FLEET_HEALTH_METRIC_CODES.maintenanceCostPerMile),
    ),
    breakdownsPer100k: toMetricValue(
      byCode.get(FLEET_HEALTH_METRIC_CODES.breakdownsPer100k),
    ),
  };
};

export const FLEET_HEALTH_METRICS = FLEET_HEALTH_METRIC_IDS;
