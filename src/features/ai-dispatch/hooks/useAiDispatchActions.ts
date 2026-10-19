/**
 * Hook quản lý các hành động điều phối AI: Chạy AI, Duyệt kế hoạch, Từ chối kế hoạch.
 */
import { useCan, useInvalidate, useNotification } from "@refinedev/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { AiMovementPlan, CreateAiDispatchParams } from "@/features/ai-dispatch/types/ai-dispatch.types";
import {
  approveAiDispatchDecision,
  executeAiDispatchRun,
  fetchAiDispatchPending,
  fetchAiDispatchSessionDetail,
  fetchAiDispatchSessions,
  mapSuggestionToPlan,
  rejectAiDispatchDecision,
} from "../api/aiDispatch.api";

export interface UseAiDispatchActionsOptions {
  initialPlans?: AiMovementPlan[];
}

export function useAiDispatchActions(options: UseAiDispatchActionsOptions = {}) {
  const { initialPlans = [] } = options;
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const invalidate = useInvalidate();
  const { open } = useNotification();

  const runAccess = useCan({ resource: "ai-dispatch", action: "AI_DISPATCH_RUN" });
  const approveAccess = useCan({ resource: "ai-dispatch", action: "AI_DISPATCH_APPROVE" });

  const [plans, setPlans] = useState<AiMovementPlan[]>(initialPlans);
  const [activePlanId, setActivePlanId] = useState<string | null>(initialPlans[0]?.id ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0] ?? null;

  const canRun = Boolean(tenant?.tenantKey && runAccess.data?.can !== false);
  const canApprove = Boolean(tenant?.tenantKey && approveAccess.data?.can !== false);

  // Tự động tải các quyết định chờ duyệt hoặc session gần nhất từ API thật
  useEffect(() => {
    if (initialPlans.length > 0) return;
    if (!tenant?.tenantKey) return;

    let mounted = true;

    async function loadRealData() {
      try {
        setPending(true);
        // 1. Kiểm tra các quyết định pending đang chờ duyệt
        const pendingSuggestions = await fetchAiDispatchPending();
        if (!mounted) return;
        if (pendingSuggestions.length > 0) {
          const mapped = pendingSuggestions.map((s) => mapSuggestionToPlan(s));
          setPlans(mapped);
          setActivePlanId(mapped[0].id);
          return;
        }

        // 2. Nếu không có pending, lấy session gần nhất
        const sessionsRes = await fetchAiDispatchSessions(0, 10);
        if (!mounted) return;
        if (sessionsRes.content.length > 0) {
          const latestSession = sessionsRes.content[0];
          const detail = await fetchAiDispatchSessionDetail(latestSession.id);
          if (!mounted) return;
          if (detail.decisions && detail.decisions.length > 0) {
            const mapped = detail.decisions.map((d) =>
              mapSuggestionToPlan(d, {
                sessionId: detail.id,
                summary: detail.summary ?? undefined,
              }),
            );
            setPlans(mapped);
            setActivePlanId(mapped[0].id);
          }
        }
      } catch (err) {
        console.warn("[useAiDispatchActions] Could not load AI dispatch sessions from API:", err);
      } finally {
        if (mounted) setPending(false);
      }
    }

    void loadRealData();

    return () => {
      mounted = false;
    };
  }, [tenant?.tenantKey, initialPlans.length]);

  const runAiDispatch = async (params: CreateAiDispatchParams): Promise<AiMovementPlan> => {
    setPending(true);
    setError(null);

    try {
      const mode = params.mode === "automatic" ? "Autonomous" : "HumanInTheLoop";
      const result = await executeAiDispatchRun({
        loadId: params.loadId,
        mode,
        maxSuggestions: 5,
        instructions: params.instructions,
      });

      if (!result.suggestions || result.suggestions.length === 0) {
        throw new Error(result.summary || "AI không tìm thấy phương án điều phối phù hợp.");
      }

      const sessionInfo = {
        sessionId: result.sessionId,
        loadId: params.loadId,
        summary: result.summary,
        instructions: params.instructions,
      };

      const newPlans = result.suggestions.map((s) => mapSuggestionToPlan(s, sessionInfo));
      setPlans((prev) => [...newPlans, ...prev]);
      setActivePlanId(newPlans[0].id);

      open?.({
        type: "success",
        message: t("aiDispatch.generatePlan"),
        description: result.summary || t("aiDispatch.planSubtitle"),
      });

      return newPlans[0];
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      open?.({
        type: "error",
        message: t("common.error"),
        description: e.message,
      });
      throw e;
    } finally {
      setPending(false);
    }
  };

  const approvePlan = async (planId: string, note?: string): Promise<AiMovementPlan> => {
    setPending(true);
    setError(null);

    try {
      await approveAiDispatchDecision(planId, note);

      const targetPlan = plans.find((p) => p.id === planId) ?? activePlan;
      const updatedPlan: AiMovementPlan = {
        ...(targetPlan ?? ({} as AiMovementPlan)),
        id: planId,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: "Dispatcher",
        aiReasoning: note ? `${targetPlan?.aiReasoning ?? ""}\n[Ghi chú duyệt: ${note}]` : targetPlan?.aiReasoning ?? "",
      };

      setPlans((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)));

      // Invalidate các resource liên quan (trips, loads, trucks)
      await Promise.all([
        invalidate({ resource: "trips", invalidates: ["list"] }),
        invalidate({ resource: "loads", invalidates: ["list"] }),
        invalidate({ resource: "trucks", invalidates: ["list"] }),
      ]);

      open?.({
        type: "success",
        message: t("aiDispatch.approveSuccess"),
        description: `${t("aiDispatch.truck")}: ${updatedPlan.truckNumber}`,
      });

      return updatedPlan;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      open?.({
        type: "error",
        message: t("common.error"),
        description: e.message,
      });
      throw e;
    } finally {
      setPending(false);
    }
  };

  const rejectPlan = async (planId: string, reason: string): Promise<AiMovementPlan> => {
    setPending(true);
    setError(null);

    try {
      await rejectAiDispatchDecision(planId, reason);

      const targetPlan = plans.find((p) => p.id === planId) ?? activePlan;
      const rejectedPlan: AiMovementPlan = {
        ...(targetPlan ?? ({} as AiMovementPlan)),
        id: planId,
        status: "rejected",
        rejectionReason: reason,
      };

      setPlans((prev) => prev.map((p) => (p.id === planId ? rejectedPlan : p)));

      open?.({
        type: "success",
        message: t("aiDispatch.rejectSuccess"),
        description: reason,
      });

      return rejectedPlan;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      open?.({
        type: "error",
        message: t("common.error"),
        description: e.message,
      });
      throw e;
    } finally {
      setPending(false);
    }
  };

  const selectPlan = (planId: string) => {
    setActivePlanId(planId);
  };

  return {
    plans,
    activePlan,
    pending,
    error,
    canRun,
    canApprove,
    runAiDispatch,
    approvePlan,
    rejectPlan,
    selectPlan,
  };
}

export type AiDispatchActionsResult = ReturnType<typeof useAiDispatchActions>;
