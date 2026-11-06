/**
 * Type definitions for Operations Dispatch Dashboard
 * Aligned with OpenAPI 3.1 schema and handoff specifications.
 */
import type {
  DeliveryDelayReport,
  ExceptionSummaryReport,
  ExpenseSummaryReport,
  FuelReport,
  KnownOperatingCpmReport,
  MaintenanceSummaryReport,
  MetricDto,
  MonthlyFinancialSummary,
  OtdReport,
  TransitTimeReport,
  LaneProfitabilityReport,
  TruckProfitabilityReport,
} from "@/types/handoff.generated";

export type DatePreset = "today" | "7d" | "30d" | "this_month" | "custom";
export type SupportedCurrency = "USD" | "EUR" | "VND" | "CAD";

export interface DashboardFilters {
  preset: DatePreset;
  from: string; // ISO date string YYYY-MM-DD
  to: string; // ISO date string YYYY-MM-DD
  currency: SupportedCurrency;
  comparePrevious: boolean;
  businessZoneId: string;
}

export interface WidgetError {
  statusCode?: number;
  code?: string;
  message: string;
  requestId?: string | null;
}

export interface WidgetAsyncState<T> {
  data?: T;
  isLoading: boolean;
  isFetching: boolean;
  error: WidgetError | null;
  isForbidden: boolean;
  refetch: () => void;
}

/**
 * Driver ranking contract proposed for TMS Dispatch Operations.
 */
export type DriverRankingSortBy =
  | "score"
  | "revenue"
  | "totalMiles"
  | "onTimePercent";

export interface DriverRankingItem {
  driverId: string;
  driverName: string;
  avatarUrl?: string;
  rank: number;
  score: number; // 0 - 100
  completedLoads: number;
  totalMiles: number;
  onTimePercent: number; // 0 - 100
  revenue: number;
  driverPay: number;
  revenuePerMile: number;
  exceptionsCount: number;
  isMock?: boolean;
}

export interface DriverRankingWeights {
  onTimeWeight: number; // e.g. 0.40 (40%)
  productivityWeight: number; // e.g. 0.30 (30%)
  revenueWeight: number; // e.g. 0.30 (30%)
}

export interface DriverRankingReport {
  period: {
    from: string;
    to: string;
  };
  currency: SupportedCurrency;
  sortBy: DriverRankingSortBy;
  drivers: DriverRankingItem[];
  weights: DriverRankingWeights;
  isMock: boolean;
}

/**
 * Monthly trend series data for Financial Chart
 */
export interface MonthlyTrendPoint {
  monthKey: string; // "YYYY-MM"
  label: string; // "Thg 1", "Jan", etc.
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  currency: string;
  isAvailable: boolean;
  reason?: string;
}

/**
 * Operations aggregate status counts
 */
export interface OperationsScaleData {
  totalLoads: number;
  activeLoads: number;
  totalTrips: number;
  activeTrips: number;
  totalTrucks: number;
  activeTrucks: number;
}

/**
 * Re-export DTO types for dashboard usage
 */
export type {
  DeliveryDelayReport,
  ExceptionSummaryReport,
  ExpenseSummaryReport,
  FuelReport,
  KnownOperatingCpmReport,
  MaintenanceSummaryReport,
  MetricDto,
  MonthlyFinancialSummary,
  OtdReport,
  TransitTimeReport,
  LaneProfitabilityReport,
  TruckProfitabilityReport,
};
