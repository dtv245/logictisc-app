/** Confirmed reporting paths, tenant-scoped cache keys and transport projection. */
import { getLogisticsApiClient } from "@/lib/apiClient";
import type { PaginationMeta } from "@/types/api.types";
import type { LoadFinancialSummaryDto, LoadProfitabilityReportDto } from "@/types/profitability/profitability.dto";
import { readApiResponse } from "@/utils/envelope";
import { ApiHttpError } from "@/utils/httpError";

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

/** One server page of load summaries; `pagination` is absent for a single-load filter. */
export interface LoadProfitabilityPage {
  rows: LoadFinancialSummaryDto[];
  pagination: PaginationMeta | null;
}

/**
 * The by-load report is paginated on the backend so the screen never asks the
 * server to compute every load in the tenant in one request.
 */
export const listLoadProfitabilityPage = async (
  page: number,
  pageSize: number,
  loadId?: string,
  signal?: AbortSignal,
): Promise<LoadProfitabilityPage> => {
  const response = await getLogisticsApiClient().instance.get(PROFITABILITY_ENDPOINTS.byLoad, {
    params: { page, pageSize, ...(loadId ? { loadId } : {}) },
    signal,
    logistics: { responseMode: "raw" },
  });
  const envelope = readApiResponse(response.data);
  if (!envelope || !Array.isArray(envelope.data)) {
    throw new ApiHttpError({
      statusCode: 200,
      code: "INVALID_PROFITABILITY_RESPONSE",
      message: "Cannot read the profitability report page",
      requestId: null,
    });
  }
  return {
    rows: envelope.data as LoadFinancialSummaryDto[],
    pagination: envelope.meta.pagination ?? null,
  };
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
