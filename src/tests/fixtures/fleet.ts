import type { FleetMetric, FleetReport } from "@/types/fleetReport.dto";
export const fleetPolicyId = "11111111-1111-4111-8111-111111111111";
export const fleetTruckId = "22222222-2222-4222-8222-222222222222";
export const otherFleetTruckId = "33333333-3333-4333-8333-333333333333";
export function fleetMetric(code: string, value: string | null, changes: Partial<FleetMetric> = {}): FleetMetric {
  return { code, value, unit: "PERCENT", availability: "AVAILABLE", numerator: "10", denominator: "20", basis: "FLEET_REPORTING_V1:SECOND", reason: null, ...changes };
}
export const fleetReport: FleetReport = {
  policyId: fleetPolicyId, policyCode: "FLEET_POLICY", policyVersion: 3, reportingPolicyCode: "FLEET_REPORTING_V1", reportingPolicyVersion: 1,
  period: { from: "2026-09-30T17:00:00Z", to: "2026-10-01T17:00:00Z", businessZoneId: "Asia/Ho_Chi_Minh" }, truckIds: [fleetTruckId],
  coverage: [{ truckId: fleetTruckId, scopeSeconds: "86400", membershipSeconds: "86400", capacitySeconds: "40000", productiveSeconds: "20000", gapSeconds: "0", conflictSeconds: "0", eventCount: 2 }],
  utilization: fleetMetric("FLEET_UTILIZATION_PERCENT", "50.00"), loadedMilesPercent: fleetMetric("LOADED_MILES_PERCENT", "70.00"), deadheadPercent: fleetMetric("DEADHEAD_PERCENT", "25.00"),
  health: [fleetMetric("UNPLANNED_DOWNTIME", null, { unit: "SECOND", availability: "UNAVAILABLE", numerator: null, denominator: null, reason: "DOWNTIME_INTERVAL_SOURCE_UNAVAILABLE" }),
    fleetMetric("PM_COMPLIANCE", null, { availability: "UNAVAILABLE", numerator: null, denominator: null, reason: "HISTORICAL_PM_DUE_OCCURRENCES_UNAVAILABLE" }),
    fleetMetric("MAINTENANCE_COST_PER_MILE", null, { unit: "MONEY_PER_MILE", availability: "UNAVAILABLE", numerator: null, denominator: null, reason: "COMPLETE_MAINTENANCE_COST_COVERAGE_UNAVAILABLE" }),
    fleetMetric("BREAKDOWNS_PER_100K_MILES", null, { unit: "COUNT_PER_100K_MILES", availability: "UNAVAILABLE", numerator: null, denominator: null, reason: "BREAKDOWN_CLASSIFICATION_UNAVAILABLE" })],
  calculatedAt: "2026-10-02T00:00:00Z",
};
