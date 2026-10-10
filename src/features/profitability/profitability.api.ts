/** Confirmed reporting paths, tenant-scoped cache keys and transport projection. */
import type { LoadFinancialSummaryDto, LoadProfitabilityReportDto } from "@/types/profitability.dto";

export const PROFITABILITY_ENDPOINTS = {
  byLoad: "/api/reports/profitability/by-load",
  summary: (loadId: string) => `/api/loads/${encodeURIComponent(loadId)}/financial-summary`,
};

export const financialQueryKeys = {
  summary: (tenantKey: string | undefined, loadId: string) => ["load-finance", tenantKey, loadId, "summary"] as const,
  costs: (tenantKey: string | undefined, loadId: string) => ["load-finance", tenantKey, loadId, "costs"] as const,
  accessorials: (tenantKey: string | undefined, loadId: string) => ["load-finance", tenantKey, loadId, "accessorials"] as const,
  byLoad: (tenantKey: string | undefined, loadId?: string) => ["profitability", tenantKey, "by-load", loadId || null] as const,
};

/** Explicit projection between two confirmed transport DTOs; no calculation. */
export const toLoadProfitabilityReport = (row: LoadFinancialSummaryDto): LoadProfitabilityReportDto => ({
  loadId: row.loadId, currency: row.currency, actualRevenue: row.actualInvoicedRevenue,
  actualCost: row.actualCost, contributionMargin: row.contributionMargin,
  allocatedProfit: row.allocatedProfit, estimatedCost: row.estimatedCost,
  marginPercent: row.marginPercentMetric, costVariance: row.costVarianceMetric,
  contributionMarginMetric: row.contributionMarginMetric, allocatedProfitMetric: row.allocatedProfitMetric,
  revenuePerTotalMile: row.mileageMetrics.revenuePerTotalMile,
  costPerTotalMile: row.mileageMetrics.costPerTotalMile,
  breakEvenLoadedRate: row.mileageMetrics.breakEvenLoadedRate,
  costClassification: row.costClassification,
});
