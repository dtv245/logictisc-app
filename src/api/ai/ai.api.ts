import axios from "axios";
import { getActiveAccessToken } from "@/providers/auth/activeToken";
import type {
  AiCapabilities,
  AiDispatchCandidate,
  AiDispatchRunResult,
  AiFeatures,
  AiGap,
  AiGapSeverity,
  AiGapStatus,
  AiRun,
  AiRunPage,
  DecisionStatus,
  DismissGapPayload,
  DispatchState,
  LoadAiDispatchResponse,
  LoadAiGapsResponse,
  LoadAiOverviewItem,
  RejectDispatchPayload,
} from "./ai.types";
import { getFieldMapping } from "./fieldKeyMapping";

export const aiEndpoints = {
  // Features / Config
  features: "/api/ai/features",
  config: "/api/ai/config",

  // Gaps (Backend: GET /api/ai/gaps?loadId=..., POST /api/ai/gaps/{id}/dismiss, POST /api/ai/gaps/check)
  gaps: (loadId: string) => `/api/ai/gaps?loadId=${encodeURIComponent(loadId)}`,
  checkGaps: "/api/ai/gaps/check",
  dismissGap: (_loadId: string, gapId: string) =>
    `/api/ai/gaps/${encodeURIComponent(gapId)}/dismiss`,
  answerGap: (_loadId: string, gapId: string) =>
    `/api/ai/gaps/${encodeURIComponent(gapId)}/answer`,

  // Dispatch (Backend: POST /api/ai/dispatch/runs, POST /api/ai/dispatch/decisions/{id}/approve|reject)
  dispatchRuns: "/api/ai/dispatch/runs",
  dispatchSessions: "/api/ai/dispatch/sessions",
  dispatchSessionDetail: (sessionId: string) =>
    `/api/ai/dispatch/sessions/${encodeURIComponent(sessionId)}`,
  dispatchPending: "/api/ai/dispatch/pending",
  approveDecision: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/approve`,
  rejectDecision: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/reject`,
  cancelSession: (sessionId: string) =>
    `/api/ai/dispatch/sessions/${encodeURIComponent(sessionId)}/cancel`,

  // Load Status, Overview & Runs
  loadStatus: (loadId: string) => `/api/ai/loads/${encodeURIComponent(loadId)}/status`,
  loadsOverview: "/api/ai/loads/overview",
  rerunLoad: (loadId: string) => `/api/ai/loads/${encodeURIComponent(loadId)}/rerun`,
  runs: "/api/ai/runs",

  // Fallback aliases
  loadGaps: (loadId: string) => `/api/ai/gaps?loadId=${encodeURIComponent(loadId)}`,
  rerunGaps: (loadId: string) => `/api/ai/loads/${encodeURIComponent(loadId)}/rerun`,
  loadDispatch: (loadId: string) => `/api/ai/loads/${encodeURIComponent(loadId)}/status`,
  approveSuggestion: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/approve`,
  rejectSuggestion: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/reject`,
  overview: "/api/ai/loads/overview",
};

export function getAuthHeaders(): Record<string, string> {
  const active = getActiveAccessToken();
  if (active) {
    return { Authorization: `Bearer ${active}` };
  }

  if (typeof window === "undefined") return {};
  try {
    const storages = [window.sessionStorage, window.localStorage].filter(Boolean);
    for (const storage of storages) {
      const lark = storage.getItem("logistics_lark_session");
      if (lark) {
        const parsed = JSON.parse(lark);
        if (parsed?.accessToken) {
          return { Authorization: `Bearer ${parsed.accessToken}` };
        }
      }
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith("oidc.user:")) {
          const raw = storage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token) {
              return { Authorization: `Bearer ${parsed.access_token}` };
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return {};
}

export const aiQueryKeys = {
  all: ["ai"] as const,
  features: (tenant?: string) => ["ai", tenant, "features"] as const,
  loadGaps: (tenant: string | undefined, loadId: string) =>
    ["ai", tenant, "loads", loadId, "gaps"] as const,
  loadDispatch: (tenant: string | undefined, loadId: string) =>
    ["ai", tenant, "loads", loadId, "dispatch"] as const,
  overview: (tenant: string | undefined, loadIds: string[]) =>
    ["ai", tenant, "loads", "overview", [...loadIds].sort().join(",")] as const,
  runs: (tenant: string | undefined, loadId: string | undefined, page: number, size: number) =>
    ["ai", tenant, "runs", loadId ?? "all", { page, size }] as const,
};

export async function fetchAiFeatures(): Promise<AiFeatures> {
  if (
    typeof window !== "undefined" &&
    window.localStorage?.getItem("logistics_force_ai_gap") === "true"
  ) {
    return {
      enabled: true,
      dryRun: false,
      gapDetection: true,
      gapEnabled: true,
      dispatchOptimization: true,
      dispatchEnabled: true,
    };
  }

  try {
    const res = await axios.get(aiEndpoints.features, { headers: getAuthHeaders() });
    const data = res.data?.data ?? res.data;
    return {
      enabled: Boolean(data?.gapDetection ?? data?.gapEnabled ?? data?.enabled ?? false),
      dryRun: Boolean(data?.dryRun ?? false),
      gapDetection: data?.gapDetection,
      gapEnabled: data?.gapEnabled,
      dispatchOptimization: data?.dispatchOptimization,
      dispatchEnabled: data?.dispatchEnabled,
      autonomousModeLocked: data?.autonomousModeLocked,
      llmProvider: data?.llmProvider,
      activeModel: data?.activeModel,
      maxTokens: data?.maxTokens,
      cooldownMinutes: data?.cooldownMinutes,
      maxAsks: data?.maxAsks,
    };
  } catch {
    return {
      enabled: false,
      dryRun: false,
      gapDetection: false,
      gapEnabled: false,
      dispatchOptimization: false,
      dispatchEnabled: false,
    };
  }
}

export async function fetchLoadAiGaps(loadId: string): Promise<LoadAiGapsResponse> {
    const res = await axios.get(aiEndpoints.gaps(loadId), { headers: getAuthHeaders() });
    const envelopeData = res.data?.data ?? res.data;
    const rawGaps = Array.isArray(envelopeData?.gaps)
      ? envelopeData.gaps
      : Array.isArray(envelopeData)
      ? envelopeData
      : [];

    const normalizedGaps: AiGap[] = (rawGaps as Array<Record<string, unknown>>).map((g) => {
      const fieldName = String(g.fieldName ?? g.fieldKey ?? "");
      // AiGapView của backend không có fieldLabel; lấy nhãn tiếng Việt từ mapping
      // form để câu hỏi dễ đọc, fallback về fieldName khi chưa có mapping.
      const mapping = getFieldMapping(fieldName);
      return {
        id: String(g.id),
        loadId: String(g.loadId ?? loadId),
        ruleCode: typeof g.ruleCode === "string" ? g.ruleCode : undefined,
        fieldName,
        fieldKey: String(g.fieldKey ?? g.fieldName ?? ""),
        fieldLabel: String(g.fieldLabel ?? mapping?.label ?? fieldName),
        question: String(g.questionNatural ?? g.questionTemplate ?? g.question ?? ""),
        questionNatural: typeof g.questionNatural === "string" ? g.questionNatural : undefined,
        questionTemplate: typeof g.questionTemplate === "string" ? g.questionTemplate : undefined,
        severity: String(g.severity ?? "warning").toLowerCase() as AiGapSeverity,
        status: String(g.status ?? "open").toLowerCase() as AiGapStatus,
        proposedValue: typeof g.proposedValue === "string" ? g.proposedValue : null,
        askCount: Number(g.askCount) || 1,
        maxAsks: Number(g.maxAsks) || 3,
        lastAskedAt: String(g.lastAskedAt ?? g.createdAt ?? ""),
        dismissReason: typeof g.dismissReason === "string" ? g.dismissReason : null,
      };
    });

    // AiGapView.Summary không trả aiState/nextRunAt/capabilities. Trạng thái chạy
    // nền do FE tự theo dõi sau khi gọi rerun; capabilities suy ra từ feature flag
    // trong hook (backend vẫn là nơi kiểm quyền cuối cùng).
    return {
      loadId,
      aiState: "idle",
      nextRunAt: null,
      gaps: normalizedGaps,
    };
}

export async function dismissAiGap(loadId: string, gapId: string, payload: DismissGapPayload) {
  const res = await axios.post(aiEndpoints.dismissGap(loadId, gapId), { reason: payload.reason }, { headers: getAuthHeaders() });
  return res.data?.data ?? res.data;
}

export type AiRerunTarget = "gap" | "dispatch" | "both";

export async function rerunAiAnalysis(
  loadId: string,
  target: AiRerunTarget = "gap",
) {
  try {
    const res = await axios.post(
      aiEndpoints.rerunLoad(loadId),
      { target },
      { headers: getAuthHeaders() },
    );
    return res.data?.data ?? res.data;
  } catch (err: unknown) {
    const axiosErr = err as {
      response?: {
        status?: number;
        data?: { retryAfterSeconds?: number };
        headers?: Record<string, string>;
      };
    };
    if (axiosErr?.response?.status === 429) {
      const retryAfter =
        Number(axiosErr?.response?.data?.retryAfterSeconds) ||
        Number(axiosErr?.response?.headers?.["retry-after"]) ||
        30;
      const error = Object.assign(new Error("RATE_LIMITED"), {
        code: "RATE_LIMITED",
        retryAfterSeconds: retryAfter,
      });
      throw error;
    }
    throw err;
  }
}

interface BackendLoadStatusView {
  loadId?: string;
  gapStatus?: string;
  blockingGapsCount?: number;
  warningGapsCount?: number;
  dispatchStatus?: string;
  latestSessionId?: string | null;
  latestDecisionId?: string | null;
  suggestedTruckId?: string | null;
  suggestedTruckNumber?: string | null;
  latestRunId?: string | null;
  latestRunStatus?: string | null;
  latestRunResultCode?: string | null;
  latestRunSummary?: string | null;
  latestRunAt?: string | null;
  capabilities?: AiCapabilities;
}

interface BackendDecision {
  decisionId?: string;
  id?: string;
  rank?: number | null;
  truckId?: string;
  truckNumber?: string | null;
  driverId?: string;
  driverName?: string | null;
  score?: number | string | null;
  confidence?: string;
  reasoning?: string;
  metrics?: AiDispatchCandidate["metrics"];
  status?: string;
}

const mapOptionalNumber = (value: number | string | null | undefined): number | null | undefined => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const mapBackendDecision = (raw: BackendDecision): AiDispatchCandidate => {
  const decisionId = String(raw.decisionId ?? raw.id ?? "");
  return {
    id: decisionId,
    decisionId,
    rank: mapOptionalNumber(raw.rank),
    truckId: String(raw.truckId ?? ""),
    truckNumber: String(raw.truckNumber ?? raw.truckId ?? ""),
    driverId: String(raw.driverId ?? ""),
    driverName: String(raw.driverName ?? raw.driverId ?? ""),
    score: mapOptionalNumber(raw.score),
    metrics: raw.metrics,
    reasoning: String(raw.reasoning ?? ""),
    confidence: typeof raw.confidence === "string" ? raw.confidence : undefined,
    status: String(raw.status ?? "PENDING") as DecisionStatus,
  };
};

/**
 * Đọc trạng thái AI của một Load từ backend thật.
 *
 * `/api/ai/loads/{loadId}/status` chỉ trả trạng thái tổng hợp, không trả danh
 * sách ứng viên. Khi có quyết định đang chờ duyệt, FE đọc thêm session detail
 * để lấy các suggestion thật (không tự bịa ứng viên).
 */
export async function fetchLoadAiDispatch(loadId: string): Promise<LoadAiDispatchResponse> {
  const res = await axios.get(aiEndpoints.loadStatus(loadId), { headers: getAuthHeaders() });
  const status = (res.data?.data ?? res.data) as BackendLoadStatusView;

  const blockingGapCount = Number(status.blockingGapsCount ?? 0);
  const backendDispatch = String(status.dispatchStatus ?? "UNASSIGNED").toUpperCase();
  const latestRunResultCode = status.latestRunResultCode ?? null;
  let dispatchState: DispatchState;
  if (backendDispatch === "EXECUTED") {
    dispatchState = "assigned";
  } else if (backendDispatch === "SUGGESTED") {
    dispatchState = "ready";
  } else if (latestRunResultCode === "EVIDENCE_UNAVAILABLE") {
    dispatchState = "evidence_unavailable";
  } else if (status.latestRunStatus === "FAILED") {
    dispatchState = "failed";
  } else if (backendDispatch === "UNASSIGNED") {
    dispatchState = blockingGapCount > 0 ? "blocked_by_gap" : "not_started";
  } else {
    dispatchState = "not_started";
  }

  const latestSessionId = status.latestSessionId ?? null;
  let suggestions: AiDispatchCandidate[] = [];
  if (latestSessionId) {
    try {
      const detailRes = await axios.get(
        aiEndpoints.dispatchSessionDetail(latestSessionId),
        { headers: getAuthHeaders() },
      );
      const detail = detailRes.data?.data ?? detailRes.data;
      const decisions: BackendDecision[] = Array.isArray(detail?.decisions)
        ? (detail.decisions as BackendDecision[])
        : [];
      suggestions = decisions.map(mapBackendDecision);
    } catch {
      // Trạng thái load vẫn dùng được khi session detail lỗi hoặc đã bị xoá.
    }
  }

  return {
    loadId,
    dispatchState,
    blockingGapCount,
    capabilities: status.capabilities ?? {},
    suggestions,
    latestSessionId,
    latestDecisionId: status.latestDecisionId ?? null,
    latestRunId: status.latestRunId ?? null,
    latestRunStatus: status.latestRunStatus ?? null,
    latestRunResultCode,
    latestRunSummary: status.latestRunSummary ?? null,
    latestRunAt: status.latestRunAt ?? null,
    suggestedTruckId: status.suggestedTruckId ?? null,
    suggestedTruckNumber: status.suggestedTruckNumber ?? null,
  };
}

/**
 * Khởi chạy AI dispatch cho một Load qua backend thật.
 * POST /api/ai/dispatch/runs — backend luôn chạy HumanInTheLoop.
 */
export async function startAiDispatchRun(
  loadId: string,
  options: { maxSuggestions?: number; instructions?: string } = {},
): Promise<AiDispatchRunResult> {
  const res = await axios.post(
    aiEndpoints.dispatchRuns,
    {
      loadId,
      mode: "HumanInTheLoop",
      maxSuggestions: options.maxSuggestions ?? 5,
      instructions: options.instructions?.trim() || undefined,
    },
    { headers: getAuthHeaders() },
  );
  return res.data?.data ?? res.data;
}

export async function approveAiDispatchSuggestion(
  _loadId: string,
  suggestionId: string,
) {
  try {
    const res = await axios.post(
      aiEndpoints.approveDecision(suggestionId),
      {},
      { headers: getAuthHeaders() },
    );
    return res.data?.data ?? res.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: unknown } };
    if (axiosErr?.response?.status === 409) {
      throw axiosErr.response.data;
    }
    throw err;
  }
}

export async function rejectAiDispatchSuggestion(
  _loadId: string,
  suggestionId: string,
  payload: RejectDispatchPayload,
) {
  const res = await axios.post(
    aiEndpoints.rejectDecision(suggestionId),
    payload,
    { headers: getAuthHeaders() },
  );
  return res.data?.data ?? res.data;
}

export async function fetchLoadsAiOverview(
  loadIds: string[],
): Promise<Record<string, LoadAiOverviewItem>> {
  if (!loadIds || loadIds.length === 0) return {};
  const boundedIds = loadIds.slice(0, 100);

  const res = await axios.post(
    aiEndpoints.loadsOverview,
    { loadIds: boundedIds },
    { headers: getAuthHeaders() },
  );
  const rawData = res.data?.data ?? res.data;
  if (Array.isArray(rawData)) {
    const map: Record<string, LoadAiOverviewItem> = {};
    for (const item of rawData as Array<Record<string, unknown>>) {
      if (item?.loadId) {
        const id = String(item.loadId);
        const blocking = Number(item.blockingGapsCount ?? item.blockingGaps) || 0;
        const warning = Number(item.warningGapsCount ?? item.warningGaps) || 0;
        const dispatchStatus = String(item.dispatchStatus ?? "").toUpperCase();
        const latestRunResultCode = typeof item.latestRunResultCode === "string"
          ? item.latestRunResultCode
          : null;
        const dispatchState: DispatchState = dispatchStatus === "EXECUTED"
          ? "assigned"
          : dispatchStatus === "SUGGESTED"
            ? "ready"
            : latestRunResultCode === "EVIDENCE_UNAVAILABLE"
              ? "evidence_unavailable"
              : typeof item.dispatchState === "string"
                ? item.dispatchState as DispatchState
                : blocking > 0
                  ? "blocked_by_gap"
                  : "not_started";
        map[id] = {
          loadId: id,
          blockingGaps: blocking,
          blockingGapsCount: blocking,
          warningGaps: warning,
          warningGapsCount: warning,
          dispatchState,
          dispatchStatus: typeof item.dispatchStatus === "string" ? item.dispatchStatus : undefined,
          latestRunStatus: typeof item.latestRunStatus === "string" ? item.latestRunStatus : null,
          latestRunResultCode,
          latestRunSummary: typeof item.latestRunSummary === "string" ? item.latestRunSummary : null,
        };
      }
    }
    return map;
  }
  return {};
}

export async function fetchAiRuns(
  loadId: string | undefined,
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<AiRunPage> {
  const res = await axios.get(aiEndpoints.runs, {
    params: { loadId, page, size },
    headers: getAuthHeaders(),
    ...(signal ? { signal } : {}),
  });
  const payload = res.data?.data ?? res.data ?? {};
  const rows: unknown[] = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  const items: AiRun[] = rows.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      loadId: row.loadId == null ? null : String(row.loadId),
      type: String(row.runType ?? row.type ?? ""),
      status: String(row.status ?? ""),
      model: String(row.modelName ?? row.model ?? ""),
      promptVersion: String(row.promptVersion ?? ""),
      tokens: Number(row.totalTokens ?? row.tokens ?? 0),
      cost: Number(row.estimatedCostUsd ?? row.cost ?? 0),
      latencyMs: Number(row.latencyMs ?? 0),
      error: row.errorMessage == null ? null : String(row.errorMessage),
      createdAt: String(row.createdAt ?? ""),
    };
  });
  return {
    items,
    totalItems: Number(payload.totalItems ?? items.length),
    totalPages: Number(payload.totalPages ?? 1),
    currentPage: Number(payload.currentPage ?? page + 1),
    pageSize: Number(payload.pageSize ?? size),
  };
}
