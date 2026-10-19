// TEMP: API types v0 contract for AI Gap and AI Dispatch. Replace with generated types when OpenAPI is ready.

export interface AiFeatures {
  enabled: boolean;
  dryRun: boolean;
  gapDetection?: boolean;
  gapEnabled?: boolean;
  dispatchOptimization?: boolean;
  dispatchEnabled?: boolean;
  autonomousModeLocked?: boolean;
  llmProvider?: string;
  activeModel?: string;
  maxTokens?: number;
  cooldownMinutes?: number;
  maxAsks?: number;
}

export interface AiCapabilities {
  canRerun?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canViewRuns?: boolean;
}

export type AiGapSeverity = "BLOCKING" | "WARNING" | "blocking" | "warning";

export type AiGapStatus =
  | "OPEN"
  | "RESOLVED"
  | "DISMISSED"
  | "NEEDS_HUMAN"
  | "open"
  | "resolved"
  | "dismissed"
  | "needs_human";

export interface AiGap {
  id: string;
  loadId: string;
  ruleCode?: string;
  severity: AiGapSeverity;
  status: AiGapStatus;
  fieldName?: string;
  fieldKey?: string;
  fieldLabel?: string;
  questionNatural?: string;
  questionTemplate?: string;
  question?: string;
  proposedValue?: string | null;
  askCount: number;
  maxAsks: number;
  lastAskedAt?: string | null;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
  assignedTo?: string | null;
  dismissReason?: string | null;
  createdAt?: string;
}

export type AiState = "debouncing" | "running" | "idle" | "disabled" | "error";

export interface LoadAiGapsResponse {
  loadId: string;
  aiState: AiState;
  nextRunAt?: string | null;
  capabilities: AiCapabilities;
  gaps: AiGap[];
}

export type DispatchState =
  | "not_started"
  | "pending"
  | "blocked_by_gap"
  | "ready"
  | "expired"
  | "failed"
  | "disabled";

export type RankingSource = "llm" | "optimization_fallback";

export interface UtilityMetric {
  score: number; // 0 - 100
  displayValue?: string;
}

export interface AiDispatchUtilities {
  margin: UtilityMetric;
  onTime: UtilityMetric;
  deadhead: UtilityMetric;
  hos: UtilityMetric;
}

export interface AiDispatchCandidateMetrics {
  estimatedRevenue?: number;
  estimatedCost?: number;
  estimatedMargin?: number;
  expectedMarginRatio?: number;
  onTimeProbability?: number;
  deadheadMiles?: number;
  totalDistanceMiles?: number;
  hosRemainingHours?: number;
}

export type DecisionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "failed"
  | "Suggested"
  | "Approved"
  | "Rejected"
  | "Executed"
  | "Failed";

export interface AiDispatchCandidate {
  id: string;
  decisionId?: string;
  rank: number;
  truckId: string;
  truckNumber: string;
  truckPlate?: string;
  driverId: string;
  driverName: string;
  score: number;
  utilities: AiDispatchUtilities;
  metrics?: AiDispatchCandidateMetrics;
  reasoning: string;
  confidenceScore: number;
  confidence?: string;
  status: DecisionStatus;
}

export interface LoadAiDispatchResponse {
  loadId: string;
  dispatchState: DispatchState;
  blockingGapCount: number;
  rankingSource: RankingSource;
  expiresAt?: string | null;
  capabilities: AiCapabilities;
  suggestions: AiDispatchCandidate[];
  activeSuggestionId?: string | null;
}

export interface LoadAiOverviewItem {
  loadId: string;
  blockingGaps: number;
  blockingGapsCount?: number;
  warningGaps: number;
  warningGapsCount?: number;
  dispatchState: DispatchState;
  dispatchStatus?: string;
}

export interface AiRun {
  id: string;
  loadId?: string | null;
  type: string;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  model: string;
  promptVersion: string;
  tokens?: number | null; // Bảo mật: chỉ trả về/hiển thị khi có quyền canViewRuns
  cost?: number | null;   // Bảo mật: chỉ trả về/hiển thị khi có quyền canViewRuns
  latencyMs: number;
  error?: string | null;
  createdAt: string;
}

export interface DismissGapPayload {
  reason: string;
}

export interface RejectDispatchPayload {
  reason: string;
  substituteDriverId?: string;
}

export const AI_ERROR_CODES = {
  BLOCKED_BY_GAP: "BLOCKED_BY_GAP",
  GAP_NOT_FOUND: "GAP_NOT_FOUND",
  CANNOT_DISMISS_BLOCKING_GAP: "CANNOT_DISMISS_BLOCKING_GAP",
  GAP_CANNOT_DISMISS_BLOCKING: "GAP_CANNOT_DISMISS_BLOCKING",
  GAP_ALREADY_RESOLVED: "GAP_ALREADY_RESOLVED",
  AI_DISPATCH_DISABLED: "AI_DISPATCH_DISABLED",
  AUTONOMOUS_MODE_LOCKED: "AUTONOMOUS_MODE_LOCKED",
  DECISION_NOT_PENDING: "DECISION_NOT_PENDING",
  REJECTION_REASON_REQUIRED: "REJECTION_REASON_REQUIRED",
  FEASIBILITY_FAILED: "FEASIBILITY_FAILED",
  LLM_BUDGET_EXCEEDED: "LLM_BUDGET_EXCEEDED",
  RATE_LIMITED: "RATE_LIMITED",
  LLM_PROVIDER_TIMEOUT: "LLM_PROVIDER_TIMEOUT",
} as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

export interface FeasibilityFailedDetails {
  code: "FEASIBILITY_FAILED";
  message: string;
  details?: {
    reasons: string[];
  };
}

export interface RerunRateLimitError {
  code: "RATE_LIMITED";
  message: string;
  retryAfterSeconds: number;
}
