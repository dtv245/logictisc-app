import { toMoneyDecimal } from "@/formatters/money";
import type { FleetMetric } from "@/types/fleetReport.dto";

export function formatMetricValue(
  value: string | number | null | undefined,
  availability: string,
  unit?: string | null
): string {
  if (!["AVAILABLE", "PARTIAL"].includes(availability) || value == null) return "—";
  try {
    const numericValue = toMoneyDecimal(value);
    if (!numericValue.isFinite()) return "—";
    if (unit === "RATIO") return `${numericValue.times(100).toString()}%`;
    return `${numericValue.toString()}${unit === "PERCENT" ? "%" : ""}`;
  } catch {
    return "—";
  }
}

export function metricText(metric: FleetMetric): string {
  return formatMetricValue(metric.value, metric.availability, metric.unit);
}
