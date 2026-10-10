/** Fetches payment attempts only for the selected driver when this tab opens. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom } from "@refinedev/core";
import { Alert, Select, Space, Table } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { formatDateTime } from "@/formatters/dateTime";
import type { ApiHttpError } from "@/providers/api/httpError";
import type { PayrollItem, PayrollPayment, PayrollRun } from "@/types/payroll.dto";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { PayrollActionError } from "./PayrollActions";
import { usePayrollPaymentActions } from "./usePayrollPaymentActions";
import { SchedulePayrollPaymentModal } from "./SchedulePayrollPaymentModal";
import { maskPaymentReference } from "./paymentDisplay";
import { payrollApi, payrollKeys } from "./payroll.api";

function PaymentAttempts({ item, run }: { item: PayrollItem; run: PayrollRun }) {
  const { t, i18n } = useTranslation(); const { tenant } = useCurrentTenant(); const access = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  const query = useCustom<PayrollPayment[], ApiHttpError>({ url: payrollApi.payments(item.id), method: "get", meta: RAW_RESPONSE_META, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && access.data?.can), queryKey: payrollKeys.payments(tenant?.tenantKey, item.id) } });
  const actions = usePayrollPaymentActions(run, item, query.isSuccess ? query.data?.data : undefined);
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  return <Space direction="vertical" style={{ width: "100%" }}><PayrollActionError error={actions.error} />
    <SchedulePayrollPaymentModal item={item} actions={actions} retry={(query.data?.data ?? []).some((payment) => payment.status === "FAILED")} />
    <Table rowKey="id" dataSource={query.data?.data ?? []} loading={query.isLoading || query.isFetching} pagination={false} scroll={{ x: "max-content" }} locale={{ emptyText: query.isLoading ? null : <EmptyState /> }} columns={[
    { title: t("payroll.attempt"), dataIndex: "attemptNumber" },
    { title: t("payroll.paymentStatus"), dataIndex: "status", render: (value: string) => <StatusTag tone={statusTone(value)} label={t(`payroll.paymentStates.${value}`, { defaultValue: value })} /> },
    { title: t("loads.financial.amount"), render: (_, row) => financialAmount(row.amount, row.currency, i18n.language) },
    { title: t("payroll.provider"), dataIndex: "providerKey", render: (value: string | null) => value ?? "—" },
    { title: t("payroll.reference"), dataIndex: "providerReference", render: maskPaymentReference },
    { title: t("payroll.failure"), render: (_, row) => row.failureCode ? <Alert type="error" message={t(`payroll.errors.${row.failureCode}`, { defaultValue: row.failureMessage ?? row.failureCode })} description={row.failureCode} /> : "—" },
    ...(["scheduledAt", "succeededAt"] as const).map((field) => ({ title: t(`payroll.${field}`), dataIndex: field, render: (value: string | null) => formatDateTime(value, { locale: i18n.language }) })),
    { title: t("common.actions"), render: (_, payment) => actions.canDispatch(payment) ? <ConfirmActionModal disabled={actions.pending} title={t("payroll.dispatchPayment")} triggerLabel={t("payroll.dispatchPayment")} triggerAriaLabel={t("payroll.dispatchPayment")} description={t("payroll.paymentConfirm")} onConfirm={async () => { await actions.execute({ action: "dispatch", payment }); }} /> : "—" },
  ]} /></Space>;
}
export function PayrollPaymentsPanel({ run }: { run: PayrollRun }) {
  const items = run.items;
  const { t } = useTranslation(); const [selectedId, setSelectedId] = useState(items[0]?.id); const selected = items.find((item) => item.id === selectedId);
  if (items.length === 0) return <EmptyState />;
  return <Space direction="vertical" style={{ width: "100%" }}><label htmlFor="payroll-payment-driver">{t("settlements.driver")}</label>
    <Select id="payroll-payment-driver" value={selectedId} onChange={setSelectedId} style={{ width: "100%" }} options={items.map((item) => ({ value: item.id, label: item.driverId }))} />
    {selected && <PaymentAttempts key={selected.id} item={selected} run={run} />}
  </Space>;
}
