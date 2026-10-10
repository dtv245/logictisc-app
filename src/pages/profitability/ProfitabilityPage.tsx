/** Backend profitability report, scoped to this screen and the authenticated tenant. */
import { useCan, useCustom } from "@refinedev/core";
import { Button, Card, Space, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { ProfitabilityFilters, type ProfitabilityFilterValues } from "@/features/profitability/ProfitabilityFilters";
import { ProfitabilitySummary } from "@/features/profitability/ProfitabilitySummary";
import { ProfitabilityBreakdownTable } from "@/features/profitability/ProfitabilityBreakdownTable";
import { financialAmount, financialMetricValue } from "@/features/profitability/financialDisplay";
import { financialQueryKeys, PROFITABILITY_ENDPOINTS, toLoadProfitabilityReport } from "@/features/profitability/profitability.api";
import { ApiHttpError } from "@/providers/api/httpError";
import type { LoadFinancialSummaryDto } from "@/types/profitability.dto";

export function ProfitabilityPage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "profitability", action: "PROFITABILITY_VIEW" });
  const [filters, setFilters] = useState<ProfitabilityFilterValues>({});
  const [selectedLoad, setSelectedLoad] = useState<string>();
  // The confirmed collection is a reporting response. Never fetch getOne for each row or aggregate it into KPIs.
  const query = useCustom<LoadFinancialSummaryDto[], ApiHttpError>({
    url: PROFITABILITY_ENDPOINTS.byLoad, method: "get", errorNotification: false,
    config: { query: filters.loadId ? { loadId: filters.loadId } : {} },
    queryOptions: { queryKey: financialQueryKeys.byLoad(tenant?.tenantKey, filters.loadId),
      enabled: Boolean(tenant?.tenantKey && access.data?.can) },
  });
  const rows = query.data?.data ?? [];
  const current = rows.find((row) => row.loadId === selectedLoad) ?? rows[0];
  const columns: ColumnsType<LoadFinancialSummaryDto> = [
    { title: t("finance.load"), render: (_, row) => row.loadNumber ?? row.loadId },
    { title: t("finance.currency"), dataIndex: "currency" },
    { title: t("finance.revenue"), render: (_, row) => financialAmount(row.actualInvoicedRevenue, row.currency, i18n.language) },
    { title: t("finance.contributionMargin"), render: (_, row) => financialMetricValue(row.contributionMarginMetric, row.currency, i18n.language) },
    { title: t("finance.allocatedProfit"), render: (_, row) => financialMetricValue(row.allocatedProfitMetric, row.currency, i18n.language) },
    { title: t("finance.marginPercent"), render: (_, row) => financialMetricValue(row.marginPercentMetric, row.currency, i18n.language) },
    { title: t("columns.actions"), render: (_, row) => <Button onClick={() => setSelectedLoad(row.loadId)}>{t("common.view")}</Button> },
  ];
  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <PageHeader title={t("finance.title")} description={t("finance.reportScope")} />
    <ProfitabilityFilters onApply={(values) => { setFilters(values); setSelectedLoad(undefined); }} />
    {query.isError ? <QueryErrorState retrying={query.isFetching} onRetry={() => void query.refetch()}
      description={<Space direction="vertical"><span>{t(`finance.errors.${query.error.code}`, { defaultValue: query.error.message })}</span>
        <Typography.Text>{query.error.code}{query.error.requestId ? ` / ${t("bootstrap.requestId.label")}: ${query.error.requestId}` : ""}</Typography.Text></Space>} />
      : query.isLoading ? <Spin /> : <>
        <Table rowKey="loadId" columns={columns} dataSource={rows} loading={query.isFetching} scroll={{ x: "max-content" }}
          locale={{ emptyText: <EmptyState /> }} pagination={{ pageSize: 10 }} />
        {current && <>
          <Typography.Title level={3}>{current.loadNumber ?? current.loadId}</Typography.Title>
          <ProfitabilitySummary report={toLoadProfitabilityReport(current)} />
          <Card title={t("finance.breakdown")}>
            {current.costClassification ? <ProfitabilityBreakdownTable costs={current.costClassification.costs} />
              : <EmptyState title={t("finance.noClassification")} />}
          </Card>
          {!!current.costClassification?.unallocatedTripCosts.length && <Card title={t("finance.unallocated")}>
            <ProfitabilityBreakdownTable costs={current.costClassification.unallocatedTripCosts} />
          </Card>}
        </>}
      </>}
  </Space>;
}
