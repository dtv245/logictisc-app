/** Read/workflow payroll page uses actual backend states and lazy payment evidence. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom } from "@refinedev/core";
import { Alert, Button, Descriptions, Space, Spin, Tabs } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { routes } from "@/constants/routes";
import { isUuid } from "@/utils/uuid";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateOnly, formatDateTime } from "@/formatters/dateTime";
import type { PayrollRun } from "@/types/payroll.dto";
import type { ApiHttpError } from "@/providers/api/httpError";
import { payrollApi, payrollKeys } from "@/features/payroll/payroll.api";
import { usePayrollActions, payrollIsValidated } from "@/features/payroll/usePayrollActions";
import { PayrollActions } from "@/features/payroll/PayrollActions";
import { PayrollItemsTable } from "@/features/payroll/PayrollItemsTable";
import { PayrollValidationPanel } from "@/features/payroll/PayrollValidationPanel";
import { PayrollPaymentsPanel } from "@/features/payroll/PayrollPaymentsPanel";
function RunDetail({ run }: { run: PayrollRun }) {
  const { t, i18n } = useTranslation(); const navigate = useNavigate(); const [tab, setTab] = useState("drivers"); const actions = usePayrollActions(run);
  const tabs = [{ key: "drivers", label: t("payroll.drivers"), view: <PayrollItemsTable items={run.items} /> },
    { key: "validation", label: t("payroll.validation"), view: <PayrollValidationPanel run={run} /> },
    { key: "payments", label: t("payroll.payments"), view: <PayrollPaymentsPanel run={run} /> },
    { key: "audit", label: t("settlements.workflow.audit"), view: <><Alert type="info" message={t("payroll.auditLimit")} /><Descriptions bordered column={{ xs: 1, sm: 2 }} items={
      (["calculatedAt", "approvedAt", "lockedAt", "completedAt"] as const).map((field) => ({ key: field, label: t(`payroll.${field}`), children: formatDateTime(run[field], { locale: i18n.language }) }))} /></> }];
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <PageHeader title={run.runNumber} extra={<Button onClick={() => navigate(routes.payroll)}>{t("payroll.openAnother")}</Button>} />
    <Descriptions column={{ xs: 1, sm: 2 }} items={[
      { key: "status", label: t("finance.workflowStatus"), children: <StatusTag tone={statusTone(run.status)} label={t(`payroll.statuses.${run.status}`, { defaultValue: run.status })} /> },
      { key: "period", label: t("settlements.payPeriod"), children: run.payPeriodId },
      { key: "date", label: t("payroll.effectiveDate"), children: formatDateOnly(run.effectiveDate, { locale: i18n.language }) },
      { key: "currency", label: t("finance.currency"), children: run.currency },
    ]} />
    {!payrollIsValidated(run) && <Alert type="warning" showIcon message={t("payroll.statuses.VALIDATION_REQUIRED")} description={run.validationReason ? t(`payroll.errors.${run.validationReason}`, { defaultValue: run.validationReason }) : t("payroll.validationIncomplete")} />}
    <PayrollActions actions={actions} />
    <Tabs activeKey={tab} onChange={setTab} items={tabs.map(({ key, label, view }) => ({ key, label, children: tab === key ? view : null }))} />
  </Space>;
}
export function PayrollRunShow() {
  const { id } = useParams<{ id: string }>(); const { tenant } = useCurrentTenant(); const access = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  const query = useCustom<PayrollRun, ApiHttpError>({ url: payrollApi.run(id ?? ""), method: "get", meta: RAW_RESPONSE_META, errorNotification: false,
    queryOptions: { queryKey: payrollKeys.run(tenant?.tenantKey, id ?? ""), enabled: Boolean(tenant?.tenantKey && isUuid(id) && access.data?.can) } });
  if (!isUuid(id)) return <NotFoundState />;
  if (access.isLoading || query.isLoading && access.data?.can === true) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  if (query.isError) return <QueryErrorState description={`${query.error.message}${query.error.requestId ? ` (${query.error.requestId})` : ""}`} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (!query.data?.data) return <EmptyState />;
  return <RunDetail key={`${tenant?.tenantKey}:${id}`} run={query.data.data} />;
}
