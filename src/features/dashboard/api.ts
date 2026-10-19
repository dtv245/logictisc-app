import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type {
  WidgetError,
} from "./types";

dayjs.extend(utc);

export interface ReportDateRange {
  from: string;
  to: string;
}

export interface ReportDateWindows {
  current: ReportDateRange;
  previous: ReportDateRange;
}

/**
 * Serializes report date range into YYYY-MM-DD strings.
 */
export function serializeReportDateRange(
  fromInput?: string | Date | dayjs.Dayjs | null,
  toInput?: string | Date | dayjs.Dayjs | null,
  defaultDays = 30,
): ReportDateRange {
  const toDayjs = toInput ? dayjs(toInput) : dayjs();
  const fromDayjs = fromInput ? dayjs(fromInput) : toDayjs.subtract(defaultDays, "day");

  return {
    from: fromDayjs.format("YYYY-MM-DD"),
    to: toDayjs.format("YYYY-MM-DD"),
  };
}

/**
 * Computes current and previous comparison date windows formatted as YYYY-MM-DD.
 */
export function computeReportDateWindows(
  fromDate?: string | null,
  toDate?: string | null,
): ReportDateWindows {
  const toDayjs = toDate ? dayjs(toDate) : dayjs();
  const fromDayjs = fromDate ? dayjs(fromDate) : toDayjs.subtract(30, "day");

  const daysDiff = Math.max(1, toDayjs.diff(fromDayjs, "day"));
  const prevToDayjs = fromDayjs.subtract(1, "day");
  const prevFromDayjs = prevToDayjs.subtract(daysDiff, "day");

  return {
    current: {
      from: fromDayjs.format("YYYY-MM-DD"),
      to: toDayjs.format("YYYY-MM-DD"),
    },
    previous: {
      from: prevFromDayjs.format("YYYY-MM-DD"),
      to: prevToDayjs.format("YYYY-MM-DD"),
    },
  };
}

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
 * Standardize API error to WidgetError { statusCode, code, message, requestId }.
 * Maps HTTP status and error codes to user-friendly Vietnamese messages, avoiding
 * raw technical leaks (e.g. "Request parameter has an invalid type", "An unexpected error occurred").
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
  const rawCode =
    err.code ??
    err.response?.data?.code;
  const code =
    rawCode ??
    (statusCode === 403
      ? "FORBIDDEN"
      : statusCode === 404
      ? "RESOURCE_NOT_FOUND"
      : statusCode === 400
      ? "MALFORMED_REQUEST"
      : "API_ERROR");

  const requestId =
    err.requestId ?? err.response?.data?.requestId ?? null;

  let message: string;
  if (statusCode === 403 || code === "FORBIDDEN") {
    message = "Không có quyền xem thông tin này";
  } else if (statusCode === 404 || code === "RESOURCE_NOT_FOUND" || code === "NOT_FOUND") {
    message = "Dữ liệu hoặc báo cáo chưa khả dụng";
  } else if (statusCode === 400 || code === "MALFORMED_REQUEST" || code === "BAD_REQUEST") {
    message = "Tham số báo cáo không hợp lệ";
  } else if (statusCode >= 500 || statusCode === 0) {
    message = "Dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.";
  } else {
    const rawMsg = err.response?.data?.message || err.message;
    if (
      !rawMsg ||
      /unexpected error|invalid type|failed with status|network error|internal error/i.test(rawMsg)
    ) {
      message = "Không thể tải dữ liệu báo cáo";
    } else {
      message = rawMsg;
    }
  }

  return { statusCode, code, message, requestId };
};

