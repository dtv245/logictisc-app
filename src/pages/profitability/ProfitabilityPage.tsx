/** Backend profitability report, paged on demand for the authenticated tenant. */
import { useCan } from "@refinedev/core";
import { Button, Card, Space, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { ProfitabilityFilters, type ProfitabilityFilterValues } from "@/features/profitability/components/ProfitabilityFilters";
import { ProfitabilitySummary } from "@/features/profitability/components/ProfitabilitySummary";
import { ProfitabilityBreakdownTable } from "@/features/profitability/components/ProfitabilityBreakdownTable";
import { useInfiniteLoadProfitability } from "@/features/profitability/hooks/useInfiniteLoadProfitability";
import { financialAmount, financialMetricValue } from "@formatters/financialDisplay";
import { toLoadProfitabilityReport } from "@/features/profitability/api/profitability.api";
import type { ApiHttpError } from "@/utils/httpError";
import type { LoadFinancialSummaryDto } from "@/types/profitability/profitability.dto";

export function ProfitabilityPage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "profitability", action: "PROFITABILITY_VIEW" });
  const [searchParams, setSearchParams] = useSearchParams();
  const filters: ProfitabilityFilterValues = { loadId: searchParams.get("loadId") ?? undefined };
  const [selectedLoad, setSelectedLoad] = useState<string>();
  const scrollContainer = useRef<HTMLDivElement>(null);
  // The confirmed collection is a reporting response. Never fetch getOne for each row or aggregate it into KPIs.
  const query = useInfiniteLoadProfitability({
    tenantKey: tenant?.tenantKey,
    loadId: filters.loadId,
    enabled: access.data?.can === true,
  });

  // Pages are appended in scroll order; a load can only appear once even if a
  // newly created load shifts the server-side window between requests.
  const rows = useMemo(() => {
    const byLoad = new Map<string, LoadFinancialSummaryDto>();
    for (const page of query.data?.pages ?? []) {
      for (const row of page.rows) {
        if (!byLoad.has(row.loadId)) byLoad.set(row.loadId, row);
      }
    }
    return [...byLoad.values()];
  }, [query.data]);
  const total = query.data?.pages[0]?.pagination?.total;
  const current = rows.find((row) => row.loadId === selectedLoad) ?? rows[0];

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Infinite scroll: append the next server page when the table body nears its end.
  useEffect(() => {
    const body = scrollContainer.current?.querySelector<HTMLElement>(".ant-table-body");
    if (!body) return undefined;
    const onScroll = () => {
      if (body.scrollTop + body.clientHeight >= body.scrollHeight - 160) loadMore();
    };
    body.addEventListener("scroll", onScroll, { passive: true });
    return () => body.removeEventListener("scroll", onScroll);
  }, [loadMore, rows.length]);

  const columns: ColumnsType<LoadFinancialSummaryDto> = useMemo(() => [
    { title: t("finance.load"), render: (_, row) => row.loadNumber ?? row.loadId },
    { title: t("finance.currency"), dataIndex: "currency" },
    { title: t("finance.revenue"), render: (_, row) => financialAmount(row.actualInvoicedRevenue, row.currency, i18n.language) },
    { title: t("finance.contributionMargin"), render: (_, row) => financialMetricValue(row.contributionMarginMetric, row.currency, i18n.language) },
    { title: t("finance.allocatedProfit"), render: (_, row) => financialMetricValue(row.allocatedProfitMetric, row.currency, i18n.language) },
    { title: t("finance.marginPercent"), render: (_, row) => financialMetricValue(row.marginPercentMetric, row.currency, i18n.language) },
    { title: t("columns.actions"), render: (_, row) => <Button onClick={() => setSelectedLoad(row.loadId)}>{t("common.view")}</Button> },
  ], [i18n.language, setSelectedLoad, t]);

  const handleFilterApply = (values: ProfitabilityFilterValues) => {
    const next = new URLSearchParams(searchParams);
    if (values.loadId) next.set("loadId", values.loadId);
    else next.delete("loadId");
    setSearchParams(next);
    setSelectedLoad(undefined);
  };

  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  const error = query.error as ApiHttpError | null;
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <PageHeader title={t("finance.title")} description={t("finance.reportScope")} />
    <ProfitabilityFilters key={filters.loadId ?? "all"} initialValues={filters} onApply={handleFilterApply} />
    {query.isError ? <QueryErrorState retrying={query.isFetching} onRetry={() => void query.refetch()}
      description={<Space direction="vertical"><span>{t(`finance.errors.${error?.code}`, { defaultValue: error?.message })}</span>
        <Typography.Text>{error?.code}{error?.requestId ? ` / ${t("bootstrap.requestId.label")}: ${error.requestId}` : ""}</Typography.Text></Space>} />
      : query.isLoading ? <Spin /> : <>
        <div ref={scrollContainer}>
          <Table rowKey="loadId" columns={columns} dataSource={rows} loading={query.isFetching && !isFetchingNextPage}
            scroll={{ x: "max-content", y: 520 }}
            locale={{ emptyText: <EmptyState /> }} pagination={false} />
        </div>
        {isFetchingNextPage
          ? <div style={{ textAlign: "center", padding: 12 }}><Space size="small"><Spin size="small" /><Typography.Text type="secondary">{t("finance.loadingMore")}</Typography.Text></Space></div>
          : hasNextPage
            ? <div style={{ textAlign: "center", padding: 12 }}>
                <Button onClick={loadMore}>{t("finance.loadMore")}</Button>
              </div>
            : rows.length > 0
              ? <Typography.Text type="secondary">
                  {t("finance.loadedAll", { count: total ?? rows.length })}
                </Typography.Text>
              : null}
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
