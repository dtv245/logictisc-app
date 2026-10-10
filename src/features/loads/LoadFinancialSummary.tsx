/** Displays the authoritative load report; never derives missing financial values. */
import { useCan, useCustom } from "@refinedev/core";
import { Spin } from "antd";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { ProfitabilitySummary } from "@/features/profitability/ProfitabilitySummary";
import { financialQueryKeys, PROFITABILITY_ENDPOINTS } from "@/features/profitability/profitability.api";
import type { LoadProfitabilityReportDto } from "@/types/profitability.dto";
import type { ApiHttpError } from "@/providers/api/httpError";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export const LoadFinancialSummary = ({ loadId }: { loadId: string }) => {
  const { tenant } = useCurrentTenant();
  const permission = useCan({ resource: "profitability", action: "PROFITABILITY_VIEW" });
  const query = useCustom<LoadProfitabilityReportDto, ApiHttpError>({
    url: PROFITABILITY_ENDPOINTS.summary(loadId), method: "get", errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && loadId && permission.data?.can),
      queryKey: financialQueryKeys.summary(tenant?.tenantKey, loadId) },
  });
  if (query.isError) return <QueryErrorState description={query.error?.message}
    onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  if (!query.data?.data) return <EmptyState />;
  return <ProfitabilitySummary report={query.data.data} />;
};
