import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { aiQueryKeys, fetchAiRuns } from "@/api/ai/ai.api";
import type { AiRunPage } from "@/api/ai/ai.types";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export interface UseAiRunsOptions {
  loadId?: string;
  canViewRuns?: boolean;
  page?: number;
  pageSize?: number;
}

export function useAiRuns({ loadId, canViewRuns = false, page = 0, pageSize = DEFAULT_LIST_PAGE_SIZE }: UseAiRunsOptions = {}) {
  const { tenant } = useCurrentTenant();
  const queryClient = useQueryClient();
  const queryKey = aiQueryKeys.runs(tenant?.tenantKey, loadId, page, pageSize);

  const query = useQuery<AiRunPage>({
    queryKey,
    queryFn: ({ signal }) => fetchAiRuns(loadId, page, pageSize, signal),
    enabled: Boolean(canViewRuns),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const pageData = query.data;
    const nextPage = page + 1;
    if (!canViewRuns || !pageData || pageData.totalItems <= nextPage * pageSize) return;
    const nextKey = aiQueryKeys.runs(tenant?.tenantKey, loadId, nextPage, pageSize);
    void queryClient.prefetchQuery(
      nextKey,
      ({ signal }) => fetchAiRuns(loadId, nextPage, pageSize, signal),
      { staleTime: 30 * 1000 },
    );
  }, [canViewRuns, loadId, page, pageSize, query.data, queryClient, tenant?.tenantKey]);

  return {
    runs: query.data?.items ?? [],
    total: query.data?.totalItems ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
