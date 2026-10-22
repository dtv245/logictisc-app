import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  approveSuggestion,
  rejectSuggestion,
  tmsKeys,
  type TmsApiError,
} from "@/api/tms-flow/tmsFlow.api";

export interface TmsDecisionInput {
  decisionId: string;
  notes?: string;
}

export interface TmsRejectInput {
  decisionId: string;
  reason: string;
}

/** Approve/reject real AI dispatch decisions and refresh every dependent view. */
export function useAiDecisionActions() {
  const queryClient = useQueryClient();

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

  return {
    approve: approve.mutateAsync,
    reject: reject.mutateAsync,
    pending: approve.isLoading || reject.isLoading,
    error: (approve.error ?? reject.error) as TmsApiError | null,
    clearError: () => {
      approve.reset();
      reject.reset();
    },
  };
}
