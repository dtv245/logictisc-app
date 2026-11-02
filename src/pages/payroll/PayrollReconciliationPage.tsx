import { payrollApi } from "@/features/payroll/api/payroll.api";
/** Server-paginated open bank-evidence cases with explicit authorized reconciliation. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom, useDataProvider } from "@refinedev/core";
import { Space, Spin, Table } from "antd";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { financialAmount } from "@formatters/financialDisplay";
import { PayrollActionError } from "@/features/payroll/components/PayrollActions";
import { usePayrollPaymentActions } from "@/features/payroll/hooks/usePayrollPaymentActions";
import { ReconcilePayrollPaymentModal } from "@/features/payroll/components/ReconcilePayrollPaymentModal";
import { maskPaymentReference } from "@/features/payroll/utils/paymentDisplay";
import type { PayrollCasesPage } from "@/types/payroll.dto";
import type { ApiHttpError } from "@/utils/httpError";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";
import { PayrollReason } from "@/components/payroll/PayrollReason";
export function PayrollReconciliationPage() {
  const { t, i18n } = useTranslation(); const { tenant } = useCurrentTenant(); const access = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const getDataProvider = useDataProvider();
  const page = normalizePage(Number(searchParams.get("current"))) - 1;
  const size = normalizePageSize(Number(searchParams.get("pageSize") ?? DEFAULT_LIST_PAGE_SIZE));
  const urlState = searchParams.toString();
  const actions = usePayrollPaymentActions();

  useEffect(() => {
    const next = new URLSearchParams(urlState);
    next.set("current", String(page + 1));
    next.set("pageSize", String(size));
    if (next.toString() !== urlState) setSearchParams(next, { replace: true });
  }, [page, setSearchParams, size, urlState]);

  const query = useCustom<PayrollCasesPage, ApiHttpError>({ url: payrollApi.reconciliationCases, method: "get", meta: RAW_RESPONSE_META, config: { query: { page, size } }, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && access.data?.can), keepPreviousData: true, staleTime: 30_000,
      queryKey: ["payroll", tenant?.tenantKey, "reconciliation-cases", { page, size }] } });

  const total = query.data?.data.totalElements ?? 0;
  useEffect(() => {
    if (!query.data || total <= (page + 1) * size || !tenant?.tenantKey || access.data?.can !== true) return;
    const nextPage = page + 1;
    const queryKey = ["payroll", tenant.tenantKey, "reconciliation-cases", { page: nextPage, size }] as const;
    void queryClient.prefetchQuery(
      queryKey,
      (context) => getDataProvider().custom!<PayrollCasesPage>({
        url: payrollApi.reconciliationCases,
        method: "get",
        query: { page: nextPage, size },
        meta: { ...RAW_RESPONSE_META, queryContext: context },
      }),
      { staleTime: 30_000 },
    );
  }, [access.data?.can, getDataProvider, page, query.data, queryClient, size, tenant?.tenantKey, total]);

  const handlePaginationChange = useCallback((nextPage: number, nextSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("current", String(nextSize === size ? nextPage : 1));
    params.set("pageSize", String(nextSize));
    setSearchParams(params);
  }, [searchParams, setSearchParams, size]);

  const columns = useMemo(() => [
    { title: t("payroll.caseId"), dataIndex: "caseEventId", width: 180, ellipsis: true },
    { title: t("payroll.paymentId"), dataIndex: "paymentId", width: 180, ellipsis: true },
    {
      title: t("payroll.paymentStatus"),
      dataIndex: "paymentStatus",
      width: 140,
      render: (value: string) => t(`payroll.paymentStates.${value}`, { defaultValue: value }),
    },
    {
      title: t("loads.financial.amount"),
      width: 130,
      render: (_: unknown, row: PayrollCasesPage["content"][number]) => (
        <strong style={{ whiteSpace: "nowrap" }}>{financialAmount(row.amount, row.currency, i18n.language)}</strong>
      ),
    },
    { title: t("payroll.reference"), dataIndex: "providerReference", width: 150, render: maskPaymentReference },
    { title: t("finance.reason"), dataIndex: "reason", width: 220, render: (reason: string | null) => <PayrollReason reason={reason} /> },
    {
      title: t("common.actions"),
      width: 160,
      fixed: "right" as const,
      render: (_: unknown, row: PayrollCasesPage["content"][number]) => (
        <ReconcilePayrollPaymentModal key={row.caseEventId} evidenceCase={row} actions={actions} />
      ),
    },
  ], [actions, i18n.language, t]);

  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  return <Space direction="vertical" size="large" style={{ width: "100%" }}><PageHeader title={t("payroll.reconciliation")} /><PayrollActionError error={actions.error} />
    <Table
      rowKey="caseEventId"
      dataSource={query.data?.data.content ?? []}
      loading={query.isLoading || query.isFetching}
      scroll={{ x: 920 }}
      locale={{ emptyText: query.isLoading ? null : <EmptyState /> }}
      pagination={{
        current: page + 1,
        pageSize: size,
        total,
        responsive: true,
        ...createListPaginationConfig(t),
        onChange: handlePaginationChange,
      }}
      columns={columns}
    />
  </Space>;
}
