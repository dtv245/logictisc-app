import { payrollApi } from "@/features/payroll/payroll.api";
/** Server-paginated open bank-evidence cases with explicit authorized reconciliation. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom } from "@refinedev/core";
import { Space, Spin, Table } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { PayrollActionError } from "@/features/payroll/PayrollActions";
import { usePayrollPaymentActions } from "@/features/payroll/usePayrollPaymentActions";
import { ReconcilePayrollPaymentModal } from "@/features/payroll/ReconcilePayrollPaymentModal";
import { maskPaymentReference } from "@/features/payroll/paymentDisplay";
import type { PayrollCasesPage } from "@/types/payroll.dto";
import type { ApiHttpError } from "@/providers/api/httpError";
export function PayrollReconciliationPage() {
  const { t, i18n } = useTranslation(); const { tenant } = useCurrentTenant(); const access = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  const [page, setPage] = useState(0); const [size, setSize] = useState(25); const actions = usePayrollPaymentActions();
  const query = useCustom<PayrollCasesPage, ApiHttpError>({ url: payrollApi.reconciliationCases, method: "get", meta: RAW_RESPONSE_META, config: { query: { page, size } }, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && access.data?.can), queryKey: ["payroll", tenant?.tenantKey, "reconciliation-cases", { page, size }] } });
  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  return <Space direction="vertical" size="large" style={{ width: "100%" }}><PageHeader title={t("payroll.reconciliation")} /><PayrollActionError error={actions.error} />
    <Table rowKey="caseEventId" dataSource={query.data?.data.content ?? []} loading={query.isLoading || query.isFetching} scroll={{ x: "max-content" }} locale={{ emptyText: query.isLoading ? null : <EmptyState /> }}
      pagination={{ current: page + 1, pageSize: size, total: query.data?.data.totalElements ?? 0, showSizeChanger: true, onChange: (nextPage, nextSize) => { setPage(nextSize === size ? nextPage - 1 : 0); setSize(nextSize); } }} columns={[
        { title: t("payroll.caseId"), dataIndex: "caseEventId" }, { title: t("payroll.paymentId"), dataIndex: "paymentId" },
        { title: t("payroll.paymentStatus"), dataIndex: "paymentStatus", render: (value: string) => t(`payroll.paymentStates.${value}`, { defaultValue: value }) },
        { title: t("loads.financial.amount"), render: (_, row) => financialAmount(row.amount, row.currency, i18n.language) },
        { title: t("payroll.reference"), dataIndex: "providerReference", render: maskPaymentReference },
        { title: t("finance.reason"), dataIndex: "reason" },
        { title: t("common.actions"), render: (_, row) => <ReconcilePayrollPaymentModal key={row.caseEventId} evidenceCase={row} actions={actions} /> },
      ]} />
  </Space>;
}
