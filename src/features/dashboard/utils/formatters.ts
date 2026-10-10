import type { MetricDto } from "../types";

/**
 * Format currency with compact (e.g. $1.2K, $3.4M) or full number display.
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currency = "USD",
  compact = false,
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }

  const symbolMap: Record<string, string> = {
    USD: "$",
    EUR: "€",
    VND: "₫",
    CAD: "CA$",
  };
  const symbol = symbolMap[currency] || `${currency} `;

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (abs >= 1_000_000) {
      return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
    }
    return `${sign}${symbol}${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: ["USD", "EUR", "CAD"].includes(currency) ? currency : "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with thousand separators.
 */
export const formatNumber = (
  value: number | null | undefined,
  decimals = 0,
  compact = false,
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  if (compact) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toFixed(1)}K`;
    }
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format percentage.
 */
export const formatPercent = (
  value: number | null | undefined,
  decimals = 1,
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format duration in minutes to human readable string (e.g. 2h 15m or 45m).
 */
export const formatDurationMinutes = (
  minutes: number | null | undefined,
): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return "—";
  }

  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded}m`;
  }

  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Format MetricDto respecting availability contract:
 * - AVAILABLE: formatted value
 * - PARTIAL: "Một phần" + reason in tooltip
 * - UNAVAILABLE | NOT_APPLICABLE: "—" + reason in tooltip
 * - NEVER display 0 when unavailable or partial
 */
export const getMetricDisplay = (
  metric: MetricDto | undefined,
  formatter: (val: number) => string,
): { display: string; tooltip?: string; isAvailable: boolean } => {
  if (!metric) {
    return { display: "—", isAvailable: false };
  }

  switch (metric.availability) {
    case "AVAILABLE":
      return {
        display: typeof metric.value === "number" ? formatter(metric.value) : "—",
        tooltip: metric.reason,
        isAvailable: true,
      };
    case "PARTIAL":
      return {
        display: "Một phần",
        tooltip: metric.reason || "Chỉ số có dữ liệu một phần",
        isAvailable: false,
      };
    case "UNAVAILABLE":
    case "NOT_APPLICABLE":
      return {
        display: "—",
        tooltip: metric.reason || "Chỉ số chưa khả dụng",
        isAvailable: false,
      };
    default:
      if (typeof metric.value === "number") {
        return { display: formatter(metric.value), isAvailable: true };
      }
      return { display: "—", tooltip: metric.reason, isAvailable: false };
  }
};
