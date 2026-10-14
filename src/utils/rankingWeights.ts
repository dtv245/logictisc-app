import type {
  DashboardFilters,
  DriverRankingWeights,
  SupportedCurrency,
} from "../types";

export const DEFAULT_RANKING_WEIGHTS: DriverRankingWeights = {
  onTimeWeight: 0.4,
  productivityWeight: 0.3,
  revenueWeight: 0.3,
};

export const DEFAULT_BUSINESS_ZONE = "America/Los_Angeles";
export const DEFAULT_CURRENCY: SupportedCurrency = "USD";
export const DEFAULT_PERIOD_DAYS = 30;

export const OPERATIONS_POLL_INTERVAL_MS = 60_000; // 60 seconds

export const FINANCIAL_ALLOWED_ROLES = [
  "ADMIN",
  "ACCOUNTANT",
  "MANAGER",
  "OWNER",
  "PAYROLL",
  "PAYROLL_MANAGER",
] as const;

export const CURRENCY_OPTIONS: Array<{ label: string; value: SupportedCurrency; symbol: string }> = [
  { label: "USD ($)", value: "USD", symbol: "$" },
  { label: "EUR (€)", value: "EUR", symbol: "€" },
  { label: "VND (₫)", value: "VND", symbol: "₫" },
  { label: "CAD ($)", value: "CAD", symbol: "$" },
];

export const RANKING_FORMULA_EXPLANATION =
  "Điểm tổng hợp = (Đúng giờ % × 40%) + (Dặm hoàn thành / Dặm max × 30%) + (Doanh thu / Doanh thu max × 30%) - (Sự cố × 2đ). Thang điểm tối đa 100.";

export const INITIAL_DASHBOARD_FILTERS: DashboardFilters = {
  preset: "30d",
  from: "", // Populated dynamically by dayjs in hooks/components
  to: "",
  currency: DEFAULT_CURRENCY,
  comparePrevious: true,
  businessZoneId: DEFAULT_BUSINESS_ZONE,
};
