import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aiQueryKeys,
  approveAiDispatchSuggestion,
  fetchLoadAiDispatch,
  rejectAiDispatchSuggestion,
} from "@/api/ai/ai.api";
import type {
  AiDispatchCandidate,
  DispatchState,
  LoadAiDispatchResponse,
  RankingSource,
} from "@/api/ai/ai.types";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export interface UseLoadAiDispatchOptions {
  loadId: string;
  enabled?: boolean;
}

export function useLoadAiDispatch({ loadId, enabled = true }: UseLoadAiDispatchOptions) {
  const { tenant } = useCurrentTenant();
  const queryClient = useQueryClient();

  const [feasibilityError, setFeasibilityError] = useState<{
    message: string;
    reasons: string[];
  } | null>(null);

  const queryKey = aiQueryKeys.loadDispatch(tenant?.tenantKey, loadId);

  const query = useQuery<LoadAiDispatchResponse>({
    queryKey,
    queryFn: () => fetchLoadAiDispatch(loadId),
    enabled: Boolean(loadId && enabled),
    staleTime: 30 * 1000,
  });

  const expiresAt = query.data?.expiresAt;
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  // Kiểm tra thời gian hết hạn của gợi ý an toàn purity
  const isExpired = Boolean(
    expiresAt && new Date(expiresAt).getTime() <= currentTimestamp
  );

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Mutation Phê duyệt
  const approveMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      approveAiDispatchSuggestion(loadId, suggestionId),
    onSuccess: () => {
      setFeasibilityError(null);
      void queryClient.invalidateQueries(queryKey);
      void queryClient.invalidateQueries(["loads", loadId]);
      void queryClient.invalidateQueries(aiQueryKeys.overview(tenant?.tenantKey, [loadId]));
    },
    onError: (err: unknown) => {
      const error = err as {
        code?: string;
        error?: string;
        details?: { reasons?: string[] };
      };
      if (error?.code === "FEASIBILITY_FAILED" || error?.error === "FEASIBILITY_FAILED") {
        setFeasibilityError({
          message: "Không thể phê duyệt do vi phạm điều kiện khả thi thực tế.",
          reasons: error?.details?.reasons ?? [
            "Tài xế hoặc xe tải không còn khả dụng trong khung giờ chuyến hàng.",
          ],
        });
        void query.refetch();
      } else if (error?.code === "SUGGESTION_EXPIRED") {
        void query.refetch();
      } else if (error?.code === "DECISION_NOT_PENDING") {
        void query.refetch();
      }
    },
  });

  // Mutation Từ chối
  const rejectMutation = useMutation({
    mutationFn: ({
      suggestionId,
      reason,
      substituteDriverId,
    }: {
      suggestionId: string;
      reason: string;
      substituteDriverId?: string;
    }) => {
      const trimmed = reason.trim();
      if (trimmed.length < 3 || trimmed.length > 500) {
        throw new Error("Lý do từ chối phải có độ dài từ 3 đến 500 ký tự.");
      }
      return rejectAiDispatchSuggestion(loadId, suggestionId, {
        reason: trimmed,
        substituteDriverId,
      });
    },
    onSuccess: () => {
      setFeasibilityError(null);
      void queryClient.invalidateQueries(queryKey);
      void queryClient.invalidateQueries(aiQueryKeys.overview(tenant?.tenantKey, [loadId]));
    },
  });

  const suggestions: AiDispatchCandidate[] = useMemo(
    () => query.data?.suggestions ?? [],
    [query.data?.suggestions],
  );

  const effectiveDispatchState: DispatchState = useMemo(() => {
    return query.data?.dispatchState ?? "not_started";
  }, [query.data?.dispatchState]);

  return {
    dispatchState: effectiveDispatchState,
    blockingGapCount: query.data?.blockingGapCount ?? 0,
    rankingSource: (query.data?.rankingSource ?? "llm") as RankingSource,
    expiresAt,
    isExpired,
    suggestions,
    capabilities: query.data?.capabilities ?? {
      canApprove: true,
      canReject: true,
      canRerun: true,
    },
    feasibilityError,
    clearFeasibilityError: () => setFeasibilityError(null),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    approveSuggestion: approveMutation.mutateAsync,
    isApproving: approveMutation.isLoading,
    rejectSuggestion: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isLoading,
  };
}
