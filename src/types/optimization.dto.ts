/** Immutable OptimizationRunController audit/command transport. No browser score calculation. */
export type OptimizationDecimal = string | number;
export interface OptimizationScope { loadId: string; tripId: string; driverId: string; truckId: string }
export interface OptimizationTarget { loadId: string; tripId: string; ratingSnapshotId: string; pickupStopId: string }
export interface OptimizationSourceSelection {
  scope: OptimizationScope; capacityInputId: string; qualificationInputId: string; forecastInputId: string;
}
export interface CreateOptimizationRequest {
  idempotencyKey: string; policyId: string; targets: OptimizationTarget[];
  driverIds: string[]; truckIds: string[]; sourceSelections: OptimizationSourceSelection[];
}
export interface OptimizationPolicyReference { code: string; version: number }
export interface OptimizationScoringPolicy {
  utilityPolicy: OptimizationPolicyReference; weightPolicy: OptimizationPolicyReference; numericPolicy: OptimizationPolicyReference;
  curves: Record<string, { raw: OptimizationDecimal; utility: OptimizationDecimal }[]>;
  weights: Record<string, OptimizationDecimal>;
  numeric: { intermediatePrecision: number; roundingMode: string; utilityScale: number; weightScale: number; contributionScale: number; scoreScale: number };
}
export interface OptimizationScore {
  policy: OptimizationScoringPolicy; finalScore: OptimizationDecimal | null;
  components: Record<string, { rawValue: OptimizationDecimal | null; rawUnit: string; normalizedUtility: OptimizationDecimal | null;
    weight: OptimizationDecimal | null; contribution: OptimizationDecimal | null }>;
}
export interface OptimizationProvenance {
  source: { type: string; reference: string; version: string; classification: "AUTHORITATIVE_DB" | "TRUSTED_ADAPTER" }; context: OptimizationScope & { planningStart: string; planningEnd: string };
  evidenceReference: string; evidenceVersion: string; unit: string; observedAt: string; expiresAt: string; maxAgeSeconds: number;
}
export interface OptimizationExplanation {
  context: OptimizationScope & { planningStart: string; planningEnd: string };
  evidence: { route: { value: { deadhead: { normalizedMiles: OptimizationDecimal | null; originalValue: OptimizationDecimal; originalUnit: string };
    loadAttributedLoadedMiles: { normalizedMiles: OptimizationDecimal | null; originalValue: OptimizationDecimal; originalUnit: string };
    appointmentStart: string | null; predictedArrivalAtPickup: string | null; pickupReachable: boolean;
    simulatedRoutePlanReference: string; simulatedRoutePlanVersion: string }; provenance: OptimizationProvenance } | null };
  hos: { value: { ruleSetCode: string; ruleSetVersion: string; simulatedRoutePlanReference: string; simulatedRoutePlanVersion: string;
    driveFeasible: boolean; dutyFeasible: boolean; breakFeasible: boolean; cycleFeasible: boolean; serviceFeasible: boolean;
    nextAvailableFeasible: boolean; minimumHosHeadroomRatio: OptimizationDecimal | null }; provenance: OptimizationProvenance } | null;
  forecast: { ratingSnapshotId: string; forecastCostIds: string[]; currency: string; expectedRevenue: OptimizationDecimal | null;
    expectedVariableCost: OptimizationDecimal | null; expectedContributionMargin: OptimizationDecimal | null } | null;
  feasible: boolean; rejectionCodes: string[]; score: OptimizationScore | null; databaseStateFingerprint: string | null;
}
export interface OptimizationCandidate {
  id: string; runId: string; loadId: string; tripId: string; driverId: string; truckId: string; ratingSnapshotId: string | null;
  feasible: boolean; rejectionCodes: string[]; finalScore: OptimizationDecimal | null; rank: number | null;
  inputFingerprint: string; explanation: OptimizationExplanation;
}
export interface OptimizationOutcome {
  run: { id: string; policyId: string; createdAt: string; planningUntil: string; createdBy: string;
    idempotencyKey: string; normalizedInputHash: string; requestSnapshot: CreateOptimizationRequest & { tenantScope: string };
    policySnapshot: { scoringPolicy: OptimizationScoringPolicy }; calculatedAt: string; durationMillis: number; correlationId: string };
  candidates: OptimizationCandidate[];
}
export interface OptimizationAccepted extends OptimizationScope {
  id: string; runId: string; candidateId: string; driverAssignmentId: string; originalInputFingerprint: string;
  revalidationSnapshot: OptimizationExplanation; acceptedBy: string; acceptedAt: string;
}
export interface AcceptOptimizationRequest { idempotencyKey: string; expectedInputFingerprint: string }
