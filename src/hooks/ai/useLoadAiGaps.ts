import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aiQueryKeys,
  dismissAiGap,
  fetchLoadAiGaps,
  rerunAiAnalysis,
} from "@/api/ai/ai.api";
import type { AiGap, AiState, LoadAiGapsResponse } from "@/api/ai/ai.types";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export interface UseLoadAiGapsOptions {
  loadId: string;
  enabled?: boolean;
}

export function useLoadAiGaps({ loadId, enabled = true }: UseLoadAiGapsOptions) {
  const { tenant } = useCurrentTenant();
  const queryClient = useQueryClient();

  const [aiState, setAiState] = useState<AiState>("idle");
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Polling backoff tracking
  const consecutivePollsRef = useRef<number>(0);

  const queryKey = aiQueryKeys.loadGaps(tenant?.tenantKey, loadId);

  const query = useQuery<LoadAiGapsResponse>({
    queryKey,
    queryFn: () => fetchLoadAiGaps(loadId),
    enabled: Boolean(loadId && enabled),
    refetchInterval: (data, query) => {
      if (query?.state?.status === "error") {
        return false;
      }
      // Dừng poll nếu tab bị ẩn
      if (typeof document !== "undefined" && document.hidden) {
        return false;
      }
      const state = data?.aiState ?? aiState;
      if (state === "debouncing" || state === "running") {
        // Backoff: 4s -> 6s -> 10s -> max 15s
        consecutivePollsRef.current += 1;
        const interval = Math.min(4000 + consecutivePollsRef.current * 2000, 15000);
        return interval;
      }
      consecutivePollsRef.current = 0;
      return false; // Dừng khi idle, disabled, error
    },
    onSuccess: (data) => {
      if (data?.aiState) {
        setAiState(data.aiState);
      }
    },
  });

  // Theo dõi visibilitychange để tạm dừng poll khi tab ẩn
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && (aiState === "debouncing" || aiState === "running")) {
        void query.refetch();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [aiState, query]);

  // Đếm ngược retryAfterSeconds khi gặp 429
  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [retryAfterSeconds]);

  // Mutation: Bỏ qua Gap (Warning only)
  const dismissMutation = useMutation({
    mutationFn: ({ gapId, reason }: { gapId: string; reason: string }) =>
      dismissAiGap(loadId, gapId, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries(queryKey);
      void queryClient.invalidateQueries(aiQueryKeys.loadDispatch(tenant?.tenantKey, loadId));
      void queryClient.invalidateQueries(aiQueryKeys.overview(tenant?.tenantKey, [loadId]));
    },
  });

  // Mutation: Chạy lại AI
  const rerunMutation = useMutation({
    mutationFn: () => rerunAiAnalysis(loadId),
    onSuccess: () => {
      setAiState("running");
      consecutivePollsRef.current = 0;
      void queryClient.invalidateQueries(queryKey);
      void queryClient.invalidateQueries(aiQueryKeys.loadDispatch(tenant?.tenantKey, loadId));
    },
    onError: (err: unknown) => {
      const error = err as { code?: string; retryAfterSeconds?: number };
      if (error?.code === "RATE_LIMITED" && error?.retryAfterSeconds) {
        setRetryAfterSeconds(error.retryAfterSeconds);
      }
    },
  });

  // Kích hoạt khi lưu load thành công để vào trạng thái debouncing
  const triggerRefreshAfterSave = useCallback(() => {
    setAiState("debouncing");
    consecutivePollsRef.current = 0;
    void query.refetch();
  }, [query]);

  const rawGaps: AiGap[] = query.data?.gaps ?? [];
  const blockingGaps = rawGaps.filter(
    (g) =>
      String(g.severity).toUpperCase() === "BLOCKING" &&
      String(g.status).toUpperCase() !== "DISMISSED" &&
      String(g.status).toUpperCase() !== "RESOLVED",
  );
  const warningGaps = rawGaps.filter(
    (g) =>
      String(g.severity).toUpperCase() === "WARNING" &&
      String(g.status).toUpperCase() !== "DISMISSED" &&
      String(g.status).toUpperCase() !== "RESOLVED",
  );
  const dismissedGaps = rawGaps.filter(
    (g) => String(g.status).toUpperCase() === "DISMISSED",
  );

  return {
    gaps: rawGaps,
    blockingGaps,
    warningGaps,
    dismissedGaps,
    aiState: query.data?.aiState ?? aiState,
    nextRunAt: query.data?.nextRunAt,
    capabilities: query.data?.capabilities ?? { canRerun: true },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    dismissGap: dismissMutation.mutateAsync,
    isDismissing: dismissMutation.isLoading,
    rerunAi: rerunMutation.mutateAsync,
    isRerunning: rerunMutation.isLoading,
    retryAfterSeconds,
    triggerRefreshAfterSave,
  };
}
