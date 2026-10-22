/**
 * API endpoints và lớp gọi API thật cho AI Dispatch (/api/ai/dispatch/...).
 */
import axios from "axios";
import { getAuthHeaders } from "@/api/ai/ai.api";
import type {
  AiMovementPlan,
  AiDispatchSession,
} from "@/features/ai-dispatch/types/ai-dispatch.types";

export const aiDispatchEndpoints = {
  runs: "/api/ai/dispatch/runs",
  sessions: "/api/ai/dispatch/sessions",
  session: (id: string) => `/api/ai/dispatch/sessions/${encodeURIComponent(id)}`,
  pending: "/api/ai/dispatch/pending",
  approve: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/approve`,
  reject: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/reject`,
  cancel: (sessionId: string) =>
    `/api/ai/dispatch/sessions/${encodeURIComponent(sessionId)}/cancel`,
  config: "/api/ai/config",
  features: "/api/ai/features",
} as const;

export const aiDispatchKeys = {
  all: ["ai-dispatch"] as const,
  sessions: (tenant?: string) => ["ai-dispatch", tenant, "sessions"] as const,
  session: (tenant: string | undefined, id: string) => ["ai-dispatch", tenant, "session", id] as const,
  activePlan: (tenant?: string) => ["ai-dispatch", tenant, "active-plan"] as const,
  pending: (tenant?: string) => ["ai-dispatch", tenant, "pending"] as const,
};

export interface BackendSuggestionMetric {
  deadheadMiles?: number | null;
  expectedMarginRatio?: number | null;
  hosRemainingHours?: number | null;
  onTimeProbability?: number | null;
  totalDistanceMiles?: number | null;
}

export interface BackendSuggestion {
  decisionId: string;
  rank: number;
  truckId: string;
  tripId?: string | null;
  truckNumber?: string | null;
  driverId: string;
  driverName?: string | null;
  score: number | string;
  confidence: string;
  reasoning: string;
  metrics?: BackendSuggestionMetric;
  status: string;
}

export interface BackendRunResult {
  sessionId: string;
  sessionNumber?: number;
  status: string;
  mode: string;
  rankingSource?: string;
  modelUsed?: string;
  tokensUsed?: { input: number; output: number; total: number };
  estimatedCostUsd?: number;
  summary?: string;
  suggestions: BackendSuggestion[];
}

export interface BackendSessionDetail {
  id: string;
  number?: number;
  mode?: string;
  status: string;
  triggeredByUserId?: string | null;
  startedAt?: string;
  completedAt?: string | null;
  modelUsed?: string | null;
  decisionCount?: number;
  estimatedCostUsd?: number;
  summary?: string | null;
  errorMessage?: string | null;
  decisions: BackendSuggestion[];
}

/**
 * Executes an AI dispatch run on the real backend.
 * POST /api/ai/dispatch/runs
 */
export async function executeAiDispatchRun(payload: {
  loadId: string;
  mode?: string;
  maxSuggestions?: number;
  instructions?: string;
}): Promise<BackendRunResult> {
  const res = await axios.post(
    aiDispatchEndpoints.runs,
    {
      loadId: payload.loadId,
      mode: payload.mode || "HumanInTheLoop",
      maxSuggestions: payload.maxSuggestions ?? 5,
      instructions: payload.instructions,
    },
    { headers: getAuthHeaders() },
  );
  return res.data?.data ?? res.data;
}

/**
 * Fetches recent AI dispatch sessions from the real backend.
 * GET /api/ai/dispatch/sessions
 */
export async function fetchAiDispatchSessions(
  page = 0,
  size = 20,
  status?: string,
): Promise<{ content: AiDispatchSession[]; totalElements: number }> {
  const params: Record<string, unknown> = { page, size };
  if (status) params.status = status;

  const res = await axios.get(aiDispatchEndpoints.sessions, {
    params,
    headers: getAuthHeaders(),
  });
  const envelope = res.data?.data ?? res.data;
  // Backend trả PagedResponse { items, totalItems }; giữ fallback content/array
  // cho các adapter hoặc fixture cũ.
  const items: AiDispatchSession[] = Array.isArray(envelope?.items)
    ? envelope.items
    : Array.isArray(envelope?.content)
    ? envelope.content
    : Array.isArray(envelope)
    ? envelope
    : [];
  return {
    content: items,
    totalElements: Number(
      envelope?.totalItems ?? envelope?.totalElements ?? items.length,
    ),
  };
}

/**
 * Fetches detail of an AI dispatch session from the real backend.
 * GET /api/ai/dispatch/sessions/{id}
 */
export async function fetchAiDispatchSessionDetail(
  sessionId: string,
): Promise<BackendSessionDetail> {
  const res = await axios.get(aiDispatchEndpoints.session(sessionId), {
    headers: getAuthHeaders(),
  });
  return res.data?.data ?? res.data;
}

/**
 * Fetches all pending decisions across sessions from the real backend.
 * GET /api/ai/dispatch/pending
 */
export async function fetchAiDispatchPending(): Promise<BackendSuggestion[]> {
  const res = await axios.get(aiDispatchEndpoints.pending, {
    headers: getAuthHeaders(),
  });
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Approves an AI dispatch decision on the real backend.
 * POST /api/ai/dispatch/decisions/{id}/approve
 */
export async function approveAiDispatchDecision(
  decisionId: string,
  notes?: string,
): Promise<BackendSuggestion> {
  const res = await axios.post(
    aiDispatchEndpoints.approve(decisionId),
    notes ? { notes } : {},
    { headers: getAuthHeaders() },
  );
  return res.data?.data ?? res.data;
}

/**
 * Rejects an AI dispatch decision on the real backend.
 * POST /api/ai/dispatch/decisions/{id}/reject
 */
export async function rejectAiDispatchDecision(
  decisionId: string,
  reason: string,
): Promise<BackendSuggestion> {
  const res = await axios.post(
    aiDispatchEndpoints.reject(decisionId),
    { reason },
    { headers: getAuthHeaders() },
  );
  return res.data?.data ?? res.data;
}

/**
 * Maps a real backend Suggestion and Session into the frontend AiMovementPlan model.
 */
export function mapSuggestionToPlan(
  suggestion: BackendSuggestion,
  sessionInfo?: {
    sessionId?: string;
    loadId?: string;
    loadNumber?: string;
    summary?: string;
    instructions?: string;
  },
): AiMovementPlan {
  return {
    id: String(suggestion.decisionId),
    sessionId: sessionInfo?.sessionId ?? "",
    ...(suggestion.tripId ? { tripId: suggestion.tripId } : {}),
    truckId: suggestion.truckId,
    truckNumber: suggestion.truckNumber ?? suggestion.truckId,
    driverId: suggestion.driverId,
    driverName: suggestion.driverName ?? suggestion.driverId,
    loadId: sessionInfo?.loadId ?? "",
    loadNumber: sessionInfo?.loadNumber ?? sessionInfo?.loadId ?? "",
    totalDistanceMiles: suggestion.metrics?.totalDistanceMiles ?? null,
    deadheadMiles: suggestion.metrics?.deadheadMiles ?? null,
    deadheadReductionPercent: null,
    estimatedDurationHours: null,
    estimatedRevenue: null,
    estimatedCost: null,
    estimatedMargin: null,
    currency: null,
    hosStatus: null,
    hosRemainingHours: suggestion.metrics?.hosRemainingHours ?? null,
    aiConfidenceScore: null,
    aiReasoning: suggestion.reasoning || sessionInfo?.summary || "Chưa có giải thích từ máy chủ",
    status: suggestion.status?.toLowerCase() === "approved" ? "approved"
      : suggestion.status?.toLowerCase() === "rejected" ? "rejected" : "proposed",
    stops: [],
  };
}
