import type {
  DriverRankingReport,
  DriverRankingSortBy,
  SupportedCurrency,
  WidgetError,
} from "./types";
import { getMockDriverRankingReport } from "./mocks/driverRanking.mock";

export const DASHBOARD_ENDPOINTS = {
  monthlyFinancials: "/api/reports/financials/monthly",
  expenses: "/api/reports/expenses",
  fuel: "/api/reports/fleet/fuel",
  maintenance: "/api/reports/fleet/maintenance",
  operatingCpm: "/api/reports/costs/known-operating-cpm",
  onTimeDelivery: "/api/reports/operations/on-time-delivery",
  delays: "/api/reports/operations/delays",
  transitTime: "/api/reports/operations/transit-time",
  exceptions: "/api/reports/operations/exceptions-summary",
  fleetHealth: "/api/reports/fleet/health",
  profitabilityByLane: "/api/reports/profitability/by-lane",
  profitabilityByTruck: "/api/reports/profitability/by-truck",
  driverRanking: "/api/reports/drivers/ranking",
  loads: "/api/loads",
  trips: "/api/trips",
  trucks: "/api/trucks",
} as const;

/**
 * Standardize API error to WidgetError { statusCode, code, message, requestId }
 */
export const normalizeWidgetError = (error: unknown): WidgetError => {
  if (!error) {
    return { message: "Đã xảy ra lỗi không xác định" };
  }
  const err = error as {
    statusCode?: number;
    code?: string;
    message?: string;
    requestId?: string | null;
    response?: {
      status?: number;
      data?: {
        code?: string;
        message?: string;
        requestId?: string;
      };
    };
  };

  const statusCode =
    err.statusCode ?? err.response?.status ?? 500;
  const code =
    err.code ??
    err.response?.data?.code ??
    (statusCode === 403 ? "FORBIDDEN" : "API_ERROR");
  const message =
    err.message ??
    err.response?.data?.message ??
    (statusCode === 403
      ? "Không có quyền xem"
      : "Không thể tải dữ liệu báo cáo");
  const requestId =
    err.requestId ?? err.response?.data?.requestId ?? null;

  return { statusCode, code, message, requestId };
};

/**
 * Fallback adapter for Driver Ranking API.
 * If VITE_USE_MOCK_RANKING is 'true' or backend endpoint is unconfirmed/404,
 * transparently provides structured mock data with `isMock: true`.
 */
export const fetchDriverRankingFallback = (
  from: string,
  to: string,
  currency: SupportedCurrency = "USD",
  sortBy: DriverRankingSortBy = "score",
): DriverRankingReport => {
  return getMockDriverRankingReport(from, to, currency, sortBy);
};
