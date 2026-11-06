import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  approveSuggestion,
  fetchPendingSuggestions,
  rejectSuggestion,
  tmsKeys,
  type TmsApiError,
} from "@/api/tms-flow/tmsFlow.api";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { TmsAiSuggestion } from "@/types/tms-flow/tmsFlow.types";

export interface TmsDecisionInput {
  decisionId: string;
  notes?: string;
}

export interface TmsRejectInput {
  decisionId: string;
  reason: string;
}

export interface TmsApproveCurrentInput extends TmsDecisionInput {
  suggestion: TmsAiSuggestion;
}

export class PendingSuggestionChangedError extends Error {
  readonly current?: TmsAiSuggestion;

  constructor(current?: TmsAiSuggestion) {
    super("The pending vehicle suggestion changed before it could be approved.");
    this.name = "PendingSuggestionChangedError";
    this.current = current;
  }
}

const sameSuggestion = (left: TmsAiSuggestion, right: TmsAiSuggestion): boolean => {
  const scalarKeys = [
    "decisionId",
    "rank",
    "truckId",
    "tripId",
    "truckNumber",
    "driverId",
    "driverName",
    "score",
    "confidence",
    "reasoning",
    "status",
  ] as const;
  const scalarFieldsMatch = scalarKeys.every((key) => left[key] === right[key]);
  const leftMetrics = JSON.stringify(
    Object.entries(left.metrics ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  );
  const rightMetrics = JSON.stringify(
    Object.entries(right.metrics ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  );
  return scalarFieldsMatch && leftMetrics === rightMetrics;
};

export class ApprovalAlreadyPendingError extends Error {
  constructor() {
    super("An approval check is already in progress.");
    this.name = "ApprovalAlreadyPendingError";
  }
}

/** Approve/reject real AI dispatch decisions and refresh every dependent view. */
export function useAiDecisionActions() {
  const queryClient = useQueryClient();
  const { tenant } = useCurrentTenant();
  const approvalCheckLock = useRef(false);
  const [approvalCheckPending, setApprovalCheckPending] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: tmsKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["loads"] });
    void queryClient.invalidateQueries({ queryKey: ["ai"] });
    void queryClient.invalidateQueries({ queryKey: ["ai-dispatch"] });
  };

  const approve = useMutation({
    mutationFn: ({ decisionId, notes }: TmsDecisionInput) =>
      approveSuggestion(decisionId, notes),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ decisionId, reason }: TmsRejectInput) =>
      rejectSuggestion(decisionId, reason),
    onSuccess: invalidate,
  });

  const approveIfCurrent = async ({
    decisionId,
    notes,
    suggestion,
  }: TmsApproveCurrentInput) => {
    if (approvalCheckLock.current) throw new ApprovalAlreadyPendingError();
    approvalCheckLock.current = true;
    setApprovalCheckPending(true);
    try {
      const currentSuggestions = await fetchPendingSuggestions();
      const current = currentSuggestions.find((item) => item.decisionId === decisionId);
      if (
        !current ||
        current.status.toUpperCase() !== "PENDING" ||
        !sameSuggestion(current, suggestion)
      ) {
        queryClient.setQueryData(tmsKeys.pending(tenant?.tenantKey), currentSuggestions);
        throw new PendingSuggestionChangedError(current);
      }
      return await approve.mutateAsync({ decisionId, notes });
    } finally {
      approvalCheckLock.current = false;
      setApprovalCheckPending(false);
    }
  };

  return {
    approve: approve.mutateAsync,
    approveIfCurrent,
    reject: reject.mutateAsync,
    pending: approvalCheckPending || approve.isLoading || reject.isLoading,
    error: (approve.error ?? reject.error) as TmsApiError | null,
    clearError: () => {
      approve.reset();
      reject.reset();
    },
  };
}
