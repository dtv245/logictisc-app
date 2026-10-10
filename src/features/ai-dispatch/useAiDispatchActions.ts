/**
 * Hook quản lý các hành động điều phối AI: Chạy AI, Duyệt kế hoạch, Từ chối kế hoạch.
 */
import { useCan, useInvalidate, useNotification } from "@refinedev/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { AiMovementPlan, CreateAiDispatchParams } from "@/types/ai-dispatch.types";
import {
  generateAiMovementPlan,
  initialMovementPlan,
} from "./aiDispatch.api";

export function useAiDispatchActions() {
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const invalidate = useInvalidate();
  const { open } = useNotification();

  const runAccess = useCan({ resource: "ai-dispatch", action: "AI_DISPATCH_RUN" });
  const approveAccess = useCan({ resource: "ai-dispatch", action: "AI_DISPATCH_APPROVE" });

  const [plans, setPlans] = useState<AiMovementPlan[]>([initialMovementPlan]);
  const [activePlanId, setActivePlanId] = useState<string>(initialMovementPlan.id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0] ?? null;

  const canRun = Boolean(tenant?.tenantKey && runAccess.data?.can !== false);
  const canApprove = Boolean(tenant?.tenantKey && approveAccess.data?.can !== false);

  const runAiDispatch = async (params: CreateAiDispatchParams): Promise<AiMovementPlan> => {
    setPending(true);
    setError(null);

    try {
      // Giả lập thời gian AI xử lý và phân tích dữ liệu lộ trình
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newPlan = generateAiMovementPlan(params);
      setPlans((prev) => [newPlan, ...prev]);
      setActivePlanId(newPlan.id);

      open?.({
        type: "success",
        message: t("aiDispatch.generatePlan"),
        description: t("aiDispatch.planSubtitle"),
      });

      return newPlan;
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
      await new Promise((resolve) => setTimeout(resolve, 400));

      const generatedTripId = crypto.randomUUID();
      const updatedPlan: AiMovementPlan = {
        ...(activePlan ?? plans[0]!),
        id: planId,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: "Dispatcher",
        tripId: generatedTripId,
        aiReasoning: note ? `${activePlan?.aiReasoning ?? ""}\n[Ghi chú duyệt: ${note}]` : activePlan?.aiReasoning ?? "",
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
        description: `${t("aiDispatch.truck")}: ${updatedPlan.truckNumber} | Trip: ${generatedTripId.slice(0, 8)}`,
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
      await new Promise((resolve) => setTimeout(resolve, 300));

      const rejectedPlan: AiMovementPlan = {
        ...(activePlan ?? plans[0]!),
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
