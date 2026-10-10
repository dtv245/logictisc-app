import type { OptimizationAccepted, OptimizationCandidate, OptimizationOutcome, OptimizationScoringPolicy, CreateOptimizationRequest } from "@/types/optimization.dto";
import { loadId } from "./finance";
export const optimizationRunId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const candidateId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const policy: OptimizationScoringPolicy = {
  utilityPolicy: { code: "UTILITY_AUTHORED", version: 3 }, weightPolicy: { code: "WEIGHTS_AUTHORED", version: 4 }, numericPolicy: { code: "NUMERIC_V1", version: 1 },
  curves: {}, weights: {}, numeric: { intermediatePrecision: 34, roundingMode: "HALF_EVEN", utilityScale: 8, weightScale: 8, contributionScale: 8, scoreScale: 8 },
};
export const optimizationRequest: CreateOptimizationRequest = { idempotencyKey: "create-key", policyId: loadId, targets: [{ loadId, tripId: loadId, ratingSnapshotId: loadId, pickupStopId: loadId }], driverIds: [loadId], truckIds: [loadId], sourceSelections: [] };
export const candidate: OptimizationCandidate = {
  id: candidateId, runId: optimizationRunId, loadId, tripId: loadId, driverId: loadId, truckId: loadId, ratingSnapshotId: loadId,
  feasible: true, rejectionCodes: [], finalScore: "91.23456789", rank: 1, inputFingerprint: "a".repeat(64), explanation: {
    context: { loadId, tripId: loadId, driverId: loadId, truckId: loadId, planningStart: "2026-10-06T00:00:00Z", planningEnd: "2026-10-09T00:00:00Z" },
    evidence: { route: null }, hos: null, forecast: { ratingSnapshotId: loadId, forecastCostIds: [loadId], currency: "EUR", expectedRevenue: "111.11", expectedVariableCost: "222.22", expectedContributionMargin: "999.99" },
    feasible: true, rejectionCodes: [], databaseStateFingerprint: "b".repeat(64), score: { policy, finalScore: "91.23456789", components: { DEADHEAD: { rawValue: "12.34", rawUnit: "MILE", normalizedUtility: "0.87654321", weight: "0.25", contribution: "21.34567890" } } },
  },
};
export const rejectedCandidate: OptimizationCandidate = { ...candidate, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", feasible: false, rejectionCodes: ["HOS_CYCLE_LIMIT_EXCEEDED"], finalScore: null, rank: null,
  explanation: { ...candidate.explanation, feasible: false, rejectionCodes: ["HOS_CYCLE_LIMIT_EXCEEDED"], score: null, forecast: null } };
export const optimization: OptimizationOutcome = { run: { id: optimizationRunId, policyId: loadId, createdAt: "2026-10-06T00:00:00Z", planningUntil: "2026-10-09T00:00:00Z", createdBy: loadId, idempotencyKey: "run-key", normalizedInputHash: "c".repeat(64), requestSnapshot: { ...optimizationRequest, tenantScope: "tenant-finance" }, policySnapshot: { scoringPolicy: policy }, calculatedAt: "2026-10-06T00:00:01Z", durationMillis: 1000, correlationId: "optimization-request" }, candidates: [candidate, rejectedCandidate] };
export const optimizationAccepted: OptimizationAccepted = { id: loadId, runId: optimizationRunId, candidateId, loadId, tripId: loadId, driverId: loadId, truckId: loadId, driverAssignmentId: loadId, originalInputFingerprint: candidate.inputFingerprint, revalidationSnapshot: candidate.explanation, acceptedBy: loadId, acceptedAt: "2026-10-06T00:01:00Z" };
