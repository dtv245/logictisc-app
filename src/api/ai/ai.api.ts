import axios from "axios";
import { getActiveAccessToken } from "@/providers/auth/activeToken";
import type {
  AiFeatures,
  AiGap,
  AiGapSeverity,
  AiGapStatus,
  AiRun,
  DismissGapPayload,
  DispatchState,
  LoadAiDispatchResponse,
  LoadAiGapsResponse,
  LoadAiOverviewItem,
  RejectDispatchPayload,
} from "./ai.types";

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
  runs: (tenant: string | undefined, loadId?: string) =>
    ["ai", tenant, "runs", loadId ?? "all"] as const,
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

    const normalizedGaps: AiGap[] = (rawGaps as Array<Record<string, unknown>>).map((g) => ({
      id: String(g.id),
      loadId: String(g.loadId ?? loadId),
      ruleCode: typeof g.ruleCode === "string" ? g.ruleCode : undefined,
      fieldName: String(g.fieldName ?? g.fieldKey ?? ""),
      fieldKey: String(g.fieldKey ?? g.fieldName ?? ""),
      fieldLabel: String(g.fieldLabel ?? g.fieldName ?? ""),
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
    }));

    return {
      loadId,
      aiState: (envelopeData?.aiState as LoadAiGapsResponse["aiState"]) ?? "idle",
      nextRunAt: envelopeData?.nextRunAt ?? null,
      capabilities: envelopeData?.capabilities ?? {
        canRerun: false,
        canApprove: false,
        canReject: false,
        canViewRuns: false,
      },
      gaps: normalizedGaps,
    };
}

export async function dismissAiGap(loadId: string, gapId: string, payload: DismissGapPayload) {
  const res = await axios.post(aiEndpoints.dismissGap(loadId, gapId), { reason: payload.reason }, { headers: getAuthHeaders() });
  return res.data?.data ?? res.data;
}

export async function rerunAiAnalysis(loadId: string) {
  try {
    const res = await axios.post(
      aiEndpoints.rerunLoad(loadId),
      {},
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

export async function fetchLoadAiDispatch(loadId: string): Promise<LoadAiDispatchResponse> {
  const res = await axios.get(aiEndpoints.loadStatus(loadId), { headers: getAuthHeaders() });
  const envelopeData = res.data?.data ?? res.data;
  return envelopeData;
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
        map[id] = {
          loadId: id,
          blockingGaps: blocking,
          blockingGapsCount: blocking,
          warningGaps: warning,
          warningGapsCount: warning,
          dispatchState:
            item.dispatchStatus === "SUGGESTED" || item.dispatchStatus === "EXECUTED"
              ? "ready"
              : typeof item.dispatchState === "string"
              ? (item.dispatchState as DispatchState)
              : "not_started",
          dispatchStatus: typeof item.dispatchStatus === "string" ? item.dispatchStatus : undefined,
        };
      }
    }
    return map;
  }
  return {};
}

export async function fetchAiRuns(loadId?: string): Promise<AiRun[]> {
  const res = await axios.get(aiEndpoints.runs, {
    params: { loadId },
    headers: getAuthHeaders(),
  });
  return res.data?.data ?? res.data ?? [];
}
