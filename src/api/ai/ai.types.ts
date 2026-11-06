// TEMP: API types v0 contract for AI features. Replace with generated types when OpenAPI is ready.

export interface AiFeatures {
  enabled: boolean;
  dryRun: boolean;
  dispatchOptimization?: boolean;
  dispatchEnabled?: boolean;
  autonomousModeLocked?: boolean;
  llmProvider?: string;
  activeModel?: string;
  maxTokens?: number;
}

export interface AiCapabilities {
  canRerun?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canViewRuns?: boolean;
}

export type DispatchState =
  | "not_started"
  | "pending"
  | "blocked_by_gap"
  | "ready"
  | "assigned"
  | "evidence_unavailable"
  | "expired"
  | "failed"
  | "disabled";

export type RankingSource = "llm" | "optimization_fallback" | "evidence_unavailable";

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
  rank?: number | null;
  truckId: string;
  truckNumber: string;
  truckPlate?: string;
  driverId: string;
  driverName: string;
  /** Null until the backend has qualified route, HOS, ETA, and cost inputs. */
  score?: number | null;
  /** Backend /api/ai/dispatch chỉ trả `metrics`, không trả điểm tiện ích đã chuẩn hoá. */
  utilities?: AiDispatchUtilities;
  metrics?: AiDispatchCandidateMetrics;
  reasoning: string;
  confidenceScore?: number;
  confidence?: string;
  status: DecisionStatus;
}

export interface LoadAiDispatchResponse {
  loadId: string;
  dispatchState: DispatchState;
  blockingGapCount: number;
  /** Không có trong LoadStatusView của backend; chỉ hiển thị khi adapter biết nguồn xếp hạng. */
  rankingSource?: RankingSource;
  expiresAt?: string | null;
  capabilities: AiCapabilities;
  suggestions: AiDispatchCandidate[];
  activeSuggestionId?: string | null;
  latestSessionId?: string | null;
  latestDecisionId?: string | null;
  latestRunId?: string | null;
  latestRunStatus?: string | null;
  latestRunResultCode?: string | null;
  latestRunSummary?: string | null;
  latestRunAt?: string | null;
  suggestedTruckId?: string | null;
  suggestedTruckNumber?: string | null;
}

export interface LoadAiOverviewItem {
  loadId: string;
  dispatchState: DispatchState;
  dispatchStatus?: string;
  latestRunStatus?: string | null;
  latestRunResultCode?: string | null;
  latestRunSummary?: string | null;
}

export interface AiDispatchRunResult {
  sessionId?: string | null;
  status?: string;
  runStatus?: string;
  resultCode?: string | null;
  rankingSource?: RankingSource;
  summary?: string | null;
  suggestions?: AiDispatchCandidate[];
}

export interface AiRun {
  id: string;
  loadId?: string | null;
  type: string;
  status: string;
  model: string;
  promptVersion: string;
  tokens?: number | null; // Bảo mật: chỉ trả về/hiển thị khi có quyền canViewRuns
  cost?: number | null;   // Bảo mật: chỉ trả về/hiển thị khi có quyền canViewRuns
  latencyMs: number;
  error?: string | null;
  createdAt: string;
}

export interface AiRunPage {
  items: AiRun[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface RejectDispatchPayload {
  reason: string;
  substituteDriverId?: string;
}

export const AI_ERROR_CODES = {
  BLOCKED_BY_GAP: "BLOCKED_BY_GAP",
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
