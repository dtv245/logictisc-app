import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { aiQueryKeys, fetchLoadsAiOverview } from "@/api/ai/ai.api";
import type { LoadAiOverviewItem } from "@/api/ai/ai.types";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export function useLoadsAiOverview(loadIds: string[], enabled = true) {
  const { tenant } = useCurrentTenant();

  const validIds = useMemo(() => {
    return Array.from(new Set(loadIds.filter(Boolean))).slice(0, 100);
  }, [loadIds]);

  const queryKey = aiQueryKeys.overview(tenant?.tenantKey, validIds);

  const query = useQuery<Record<string, LoadAiOverviewItem>>({
    queryKey,
    queryFn: () => fetchLoadsAiOverview(validIds),
    enabled: Boolean(validIds.length > 0 && enabled),
    staleTime: 60 * 1000,
  });

  const overviewMap = query.data ?? {};

  const getOverview = (loadId: string): LoadAiOverviewItem | undefined => {
    return overviewMap[loadId];
  };

  return {
    overviewMap,
    getOverview,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
