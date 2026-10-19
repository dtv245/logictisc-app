import { useQuery } from "@tanstack/react-query";
import { aiQueryKeys, fetchAiRuns } from "@/api/ai/ai.api";
import type { AiRun } from "@/api/ai/ai.types";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export interface UseAiRunsOptions {
  loadId?: string;
  canViewRuns?: boolean;
}

export function useAiRuns({ loadId, canViewRuns = false }: UseAiRunsOptions = {}) {
  const { tenant } = useCurrentTenant();

  const queryKey = aiQueryKeys.runs(tenant?.tenantKey, loadId);

  const query = useQuery<AiRun[]>({
    queryKey,
    queryFn: () => fetchAiRuns(loadId),
    enabled: Boolean(canViewRuns),
    staleTime: 30 * 1000,
  });

  return {
    runs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
