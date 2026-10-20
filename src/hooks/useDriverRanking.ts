import { useMemo, useState } from "react";
import { useCustom } from "@refinedev/core";

import type {
  DashboardFilters,
  DriverRankingReport,
  DriverRankingSortBy,
  WidgetAsyncState,
} from "@/features/dashboard/types";
import {
  DASHBOARD_ENDPOINTS,
  normalizeWidgetError,
  serializeReportDateRange,
} from "@/features/dashboard/api";

export function useDriverRanking(filters: DashboardFilters) {
  const [sortBy, setSortBy] = useState<DriverRankingSortBy>("score");

  const dateRange = useMemo(
    () => serializeReportDateRange(filters.from, filters.to),
    [filters.from, filters.to],
  );

  const rankingQuery = useCustom<DriverRankingReport>({
    url: DASHBOARD_ENDPOINTS.driverRanking,
    method: "get",
    config: {
      query: {
        from: dateRange.from,
        to: dateRange.to,
        currency: filters.currency,
        sortBy,
        limit: 10,
      },
    },
    queryOptions: {
      enabled: Boolean(filters.from && filters.to),
      staleTime: 60_000,
      keepPreviousData: true,
      retry: false,
    },
  });

  // Refine returns a fresh query result object across renders. Deriving this small
  // view state directly avoids memoizing against that unstable object identity.
  const error = rankingQuery.error
    ? normalizeWidgetError(rankingQuery.error)
    : null;
  const state: WidgetAsyncState<DriverRankingReport> = {
    data: rankingQuery.data?.data,
    isLoading: rankingQuery.isLoading,
    isFetching: rankingQuery.isFetching,
    error,
    isForbidden: error?.statusCode === 403,
    refetch: () => void rankingQuery.refetch(),
  };

  return {
    ...state,
    sortBy,
    setSortBy,
    isMock: false,
  };
}
