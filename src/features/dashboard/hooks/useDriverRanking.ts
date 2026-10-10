import { useMemo, useState } from "react";
import { useCustom } from "@refinedev/core";

import type {
  DashboardFilters,
  DriverRankingReport,
  DriverRankingSortBy,
  WidgetAsyncState,
} from "../types";
import { DASHBOARD_ENDPOINTS, fetchDriverRankingFallback } from "../api";

export function useDriverRanking(filters: DashboardFilters) {
  const [sortBy, setSortBy] = useState<DriverRankingSortBy>("score");

  const useMockRankingEnv = import.meta.env.VITE_USE_MOCK_RANKING === "true";

  const rankingQuery = useCustom<DriverRankingReport>({
    url: DASHBOARD_ENDPOINTS.driverRanking,
    method: "get",
    config: {
      query: {
        from: filters.from,
        to: filters.to,
        currency: filters.currency,
        sortBy,
        limit: 10,
      },
    },
    queryOptions: {
      enabled: !useMockRankingEnv && Boolean(filters.from && filters.to),
      staleTime: 60_000,
      keepPreviousData: true,
      retry: false,
    },
  });

  const state: WidgetAsyncState<DriverRankingReport> = useMemo(() => {
    // If mock env is true or query errored/unimplemented, fall back to mock report
    if (useMockRankingEnv || rankingQuery.isError) {
      const mockReport = fetchDriverRankingFallback(
        filters.from,
        filters.to,
        filters.currency,
        sortBy,
      );
      return {
        data: mockReport,
        isLoading: false,
        isFetching: false,
        error: null,
        isForbidden: false,
        refetch: () => void rankingQuery.refetch(),
      };
    }

    const error = null;
    return {
      data: rankingQuery.data?.data,
      isLoading: rankingQuery.isLoading,
      isFetching: rankingQuery.isFetching,
      error,
      isForbidden: false,
      refetch: () => void rankingQuery.refetch(),
    };
  }, [
    useMockRankingEnv,
    rankingQuery,
    filters.from,
    filters.to,
    filters.currency,
    sortBy,
  ]);

  return {
    ...state,
    sortBy,
    setSortBy,
    isMock: state.data?.isMock ?? true,
  };
}
