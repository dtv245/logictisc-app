/** FleetHistory.Report / MetricDto. This is distinct from legacy Executive FleetHealthDto. */
export type FleetDecimal = string | number;
export interface FleetMetric {
  code: string; value: FleetDecimal | null; unit: string | null; numerator: FleetDecimal | null; denominator: FleetDecimal | null;
  availability: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE"; basis: string | null; reason: string | null;
}
export interface FleetCoverage {
  truckId: string; scopeSeconds: FleetDecimal; membershipSeconds: FleetDecimal; capacitySeconds: FleetDecimal;
  productiveSeconds: FleetDecimal; gapSeconds: FleetDecimal; conflictSeconds: FleetDecimal; eventCount: number;
}
export interface FleetReport {
  policyId: string; policyCode: string; policyVersion: number; reportingPolicyCode: string; reportingPolicyVersion: number;
  period: { from: string; to: string; businessZoneId: string | null }; truckIds: string[]; coverage: FleetCoverage[];
  utilization: FleetMetric; loadedMilesPercent: FleetMetric; deadheadPercent: FleetMetric; health: FleetMetric[]; calculatedAt: string;
}
export interface FleetReportQuery { policyId: string; truckIds: string; firstDate: string; exclusiveLastDate: string; businessZoneId: string }
