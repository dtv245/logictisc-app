import { useEffect, useMemo, useState } from "react";
import { useCustom, useDataProvider, useList } from "@refinedev/core";
import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";

import type {
  DashboardFilters,
  DeliveryDelayReport,
  ExceptionSummaryReport,
  ExpenseSummaryReport,
  FuelReport,
  KnownOperatingCpmReport,
  LaneProfitabilityReport,
  MaintenanceSummaryReport,
  MonthlyFinancialSummary,
  MonthlyTrendPoint,
  OtdReport,
  TransitTimeReport,
  TruckProfitabilityReport,
  WidgetAsyncState,
} from "../types";
import { DASHBOARD_ENDPOINTS, normalizeWidgetError } from "../api";
import { calculateProfit } from "../utils/calculations";

export interface UseDashboardDataOptions {
  enableFinancials?: boolean;
}

export function useDashboardData(
  filters: DashboardFilters,
  options: UseDashboardDataOptions = {},
) {
  const { enableFinancials = true } = options;
  const dataProvider = useDataProvider();

  // 1. Tab visibility tracking to pause polling when tab is hidden
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const opsPollInterval: number | false = isDocumentVisible ? 60_000 : false;

  // 2. Compute date windows (current and previous for comparison)
  const dateWindows = useMemo(() => {
    const toDate = filters.to ? dayjs(filters.to) : dayjs();
    const fromDate = filters.from ? dayjs(filters.from) : toDate.subtract(30, "day");

    const daysDiff = Math.max(1, toDate.diff(fromDate, "day"));
    const prevTo = fromDate.subtract(1, "day");
    const prevFrom = prevTo.subtract(daysDiff, "day");

    return {
      current: {
        from: fromDate.format("YYYY-MM-DD"),
        to: toDate.format("YYYY-MM-DD"),
      },
      previous: {
        from: prevFrom.format("YYYY-MM-DD"),
        to: prevTo.format("YYYY-MM-DD"),
      },
    };
  }, [filters.from, filters.to]);

  const currentFrom = dateWindows.current.from;
  const currentTo = dateWindows.current.to;
  const prevFrom = dateWindows.previous.from;
  const prevTo = dateWindows.previous.to;

  // ==================== FINANCIAL QUERIES ====================

  // a) Monthly Financial Trend (Parallel queries for last 6 months)
  const last6Months = useMemo(() => {
    const target = dayjs(currentTo);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = target.subtract(i, "month");
      months.push({
        year: m.year(),
        month: m.month() + 1,
        monthKey: m.format("YYYY-MM"),
        label: m.format("MM/YYYY"),
      });
    }
    return months;
  }, [currentTo]);

  const monthlyTrendQueries = useQueries({
    queries: last6Months.map((m) => ({
      queryKey: [
        "dashboard",
        "financials",
        "monthly",
        m.year,
        m.month,
        filters.currency,
      ],
      queryFn: async (): Promise<MonthlyFinancialSummary | undefined> => {
        const provider = dataProvider();
        if (!provider?.custom) return undefined;
        const res = await provider.custom<MonthlyFinancialSummary>({
          url: DASHBOARD_ENDPOINTS.monthlyFinancials,
          method: "get",
          query: {
            year: m.year,
            month: m.month,
            currency: filters.currency,
          },
        });
        return res.data;
      },
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      refetchInterval: false as const,
    })),
  });

  const monthlyTrendPoints: MonthlyTrendPoint[] = useMemo(() => {
    return last6Months.map((m, index) => {
      const q = monthlyTrendQueries[index];
      const data = q?.data as MonthlyFinancialSummary | undefined;
      const revenue = data?.totalRevenue ?? 0;
      const cost = data?.knownOperatingCost ?? 0;
      const { profit, marginPercent } = calculateProfit(revenue, cost);

      const isAvailable =
        data?.knownOperatingCostAvailability === "AVAILABLE" ||
        (Boolean(data) && !data?.knownOperatingCostAvailability);

      return {
        monthKey: m.monthKey,
        label: m.label,
        revenue,
        cost,
        profit,
        marginPercent: marginPercent ?? 0,
        currency: filters.currency,
        isAvailable,
        reason: data?.knownOperatingCostAvailabilityReason,
      };
    });
  }, [last6Months, monthlyTrendQueries, filters.currency]);

  // b) Expenses Summary
  const expensesQuery = useCustom<ExpenseSummaryReport>({
    url: DASHBOARD_ENDPOINTS.expenses,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
        currency: filters.currency,
      },
    },
    queryOptions: {
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // Previous expenses for delta comparison
  const prevExpensesQuery = useCustom<ExpenseSummaryReport>({
    url: DASHBOARD_ENDPOINTS.expenses,
    method: "get",
    config: {
      query: {
        from: prevFrom,
        to: prevTo,
        currency: filters.currency,
      },
    },
    queryOptions: {
      enabled: Boolean(
        enableFinancials && filters.comparePrevious && prevFrom && prevTo,
      ),
      staleTime: 10 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // c) Operating CPM
  const operatingCpmQuery = useCustom<KnownOperatingCpmReport>({
    url: DASHBOARD_ENDPOINTS.operatingCpm,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
        currency: filters.currency,
      },
    },
    queryOptions: {
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  const prevOperatingCpmQuery = useCustom<KnownOperatingCpmReport>({
    url: DASHBOARD_ENDPOINTS.operatingCpm,
    method: "get",
    config: {
      query: {
        from: prevFrom,
        to: prevTo,
        currency: filters.currency,
      },
    },
    queryOptions: {
      enabled: Boolean(
        enableFinancials && filters.comparePrevious && prevFrom && prevTo,
      ),
      staleTime: 10 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // d) Fuel Report
  const fuelQuery = useCustom<FuelReport>({
    url: DASHBOARD_ENDPOINTS.fuel,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
      },
    },
    queryOptions: {
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // e) Maintenance Summary
  const maintenanceQuery = useCustom<MaintenanceSummaryReport>({
    url: DASHBOARD_ENDPOINTS.maintenance,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
      },
    },
    queryOptions: {
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // ==================== OPERATIONS QUERIES ====================

  // f) On-Time Delivery (OTD)
  const otdQuery = useCustom<OtdReport>({
    url: DASHBOARD_ENDPOINTS.onTimeDelivery,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
      },
    },
    queryOptions: {
      enabled: Boolean(currentFrom && currentTo),
      staleTime: 30_000,
      keepPreviousData: true,
      refetchInterval: opsPollInterval,
    },
  });

  const prevOtdQuery = useCustom<OtdReport>({
    url: DASHBOARD_ENDPOINTS.onTimeDelivery,
    method: "get",
    config: {
      query: {
        from: prevFrom,
        to: prevTo,
      },
    },
    queryOptions: {
      enabled: Boolean(filters.comparePrevious && prevFrom && prevTo),
      staleTime: 10 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // g) Delivery Delays
  const delaysQuery = useCustom<DeliveryDelayReport>({
    url: DASHBOARD_ENDPOINTS.delays,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
      },
    },
    queryOptions: {
      enabled: Boolean(currentFrom && currentTo),
      staleTime: 30_000,
      keepPreviousData: true,
      refetchInterval: opsPollInterval,
    },
  });

  // h) Transit Time
  const transitTimeQuery = useCustom<TransitTimeReport>({
    url: DASHBOARD_ENDPOINTS.transitTime,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
      },
    },
    queryOptions: {
      enabled: Boolean(currentFrom && currentTo),
      staleTime: 30_000,
      keepPreviousData: true,
      refetchInterval: opsPollInterval,
    },
  });

  // i) Exceptions Summary
  const exceptionsQuery = useCustom<ExceptionSummaryReport>({
    url: DASHBOARD_ENDPOINTS.exceptions,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
      },
    },
    queryOptions: {
      enabled: Boolean(currentFrom && currentTo),
      staleTime: 30_000,
      keepPreviousData: true,
      refetchInterval: opsPollInterval,
    },
  });

  // j) Profitability by Lane (Top/Bottom lanes)
  const laneProfitabilityQuery = useCustom<LaneProfitabilityReport[]>({
    url: DASHBOARD_ENDPOINTS.profitabilityByLane,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
        currency: filters.currency,
      },
    },
    queryOptions: {
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // k) Profitability by Truck (Top/Bottom trucks)
  const truckProfitabilityQuery = useCustom<TruckProfitabilityReport[]>({
    url: DASHBOARD_ENDPOINTS.profitabilityByTruck,
    method: "get",
    config: {
      query: {
        from: currentFrom,
        to: currentTo,
        currency: filters.currency,
      },
    },
    queryOptions: {
      enabled: Boolean(enableFinancials && currentFrom && currentTo),
      staleTime: 5 * 60_000,
      keepPreviousData: true,
      refetchInterval: false,
    },
  });

  // l) Status Counts (Loads, Trips, Trucks) via total count
  const loadsCountQuery = useList({
    resource: "loads",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: {
      staleTime: 30_000,
      refetchInterval: opsPollInterval,
    },
  });

  const tripsCountQuery = useList({
    resource: "trips",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: {
      staleTime: 30_000,
      refetchInterval: opsPollInterval,
    },
  });

  const trucksCountQuery = useList({
    resource: "trucks",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: {
      staleTime: 30_000,
      refetchInterval: opsPollInterval,
    },
  });

  // Helper to pack state into WidgetAsyncState<T>
  const toWidgetState = <T>(
    query: {
      data?: { data: T } | null;
      isLoading: boolean;
      isFetching: boolean;
      error: unknown;
      refetch: () => void;
    },
  ): WidgetAsyncState<T> => {
    const error = query.error ? normalizeWidgetError(query.error) : null;
    return {
      data: query.data?.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error,
      isForbidden: error?.statusCode === 403,
      refetch: query.refetch,
    };
  };

  // Refetch all queries
  const refetchAll = () => {
    monthlyTrendQueries.forEach((q) => void q.refetch());
    void expensesQuery.refetch();
    void operatingCpmQuery.refetch();
    void fuelQuery.refetch();
    void maintenanceQuery.refetch();
    void otdQuery.refetch();
    void delaysQuery.refetch();
    void transitTimeQuery.refetch();
    void exceptionsQuery.refetch();
    void laneProfitabilityQuery.refetch();
    void truckProfitabilityQuery.refetch();
    void loadsCountQuery.refetch();
    void tripsCountQuery.refetch();
    void trucksCountQuery.refetch();
  };

  return {
    dateWindows,
    monthlyTrend: {
      points: monthlyTrendPoints,
      isLoading: monthlyTrendQueries.some((q) => q.isLoading),
      isFetching: monthlyTrendQueries.some((q) => q.isFetching),
      refetch: () => monthlyTrendQueries.forEach((q) => void q.refetch()),
    },
    expenses: toWidgetState(expensesQuery),
    prevExpenses: toWidgetState(prevExpensesQuery),
    operatingCpm: toWidgetState(operatingCpmQuery),
    prevOperatingCpm: toWidgetState(prevOperatingCpmQuery),
    fuel: toWidgetState(fuelQuery),
    maintenance: toWidgetState(maintenanceQuery),
    otd: toWidgetState(otdQuery),
    prevOtd: toWidgetState(prevOtdQuery),
    delays: toWidgetState(delaysQuery),
    transitTime: toWidgetState(transitTimeQuery),
    exceptions: toWidgetState(exceptionsQuery),
    laneProfitability: toWidgetState(laneProfitabilityQuery),
    truckProfitability: toWidgetState(truckProfitabilityQuery),
    counts: {
      totalLoads: loadsCountQuery.data?.total ?? 0,
      totalTrips: tripsCountQuery.data?.total ?? 0,
      totalTrucks: trucksCountQuery.data?.total ?? 0,
      isLoading:
        loadsCountQuery.isLoading ||
        tripsCountQuery.isLoading ||
        trucksCountQuery.isLoading,
      refetch: () => {
        void loadsCountQuery.refetch();
        void tripsCountQuery.refetch();
        void trucksCountQuery.refetch();
      },
    },
    refetchAll,
  };
}
