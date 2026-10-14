/** Financial display formatting only; missing values are never replaced by zero. */
import { formatMoney, toMoneyDecimal } from "@/formatters/money";
import type { FinancialDecimal, ProfitabilityMetricDto } from "@/types/profitability.dto";

export function financialAmount(value: FinancialDecimal | null | undefined, currency: string | null | undefined, locale: string): string {
  if (value == null || !currency) return "—";
  try { return formatMoney(value, { currency, locale, currencyDisplay: "code" }); }
  catch { return "—"; }
}

export function financialMetricValue(metric: ProfitabilityMetricDto | null | undefined, currency: string, locale: string): string {
  if (!metric || !["AVAILABLE", "PARTIAL"].includes(metric.availability) || metric.value == null) return "—";
  try {
    if (metric.unit === "PERCENT") return `${toMoneyDecimal(metric.value).toString()}%`;
    // Scaling an explicit ratio to percent is display formatting only.
    if (metric.unit === "RATIO") return `${toMoneyDecimal(metric.value).times(100).toString()}%`;
    return formatMoney(metric.value, { currency, locale, currencyDisplay: "code",
      ...(metric.unit === "CURRENCY_PER_MILE" ? { minimumFractionDigits: 0, maximumFractionDigits: 4 } : {}) });
  } catch { return "—"; }
}
