/** Self-service listing only requests the employee-bound payslip endpoint. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom } from "@refinedev/core";
import { Button, Spin, Table } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { routes } from "@/constants/routes";
import { isUuid } from "@/utils/uuid";
import { formatDateOnly, formatDateTime } from "@/formatters/dateTime";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { payslipApi, payslipKeys } from "@/features/payslips/payslip.api";
import { readPayslipSnapshot } from "@/features/payslips/payslip.snapshot";
import type { PayslipDto } from "@/types/payslip.dto";
import type { ApiHttpError } from "@/providers/api/httpError";
export function MyPayslipsPage() {
  const { t, i18n } = useTranslation(); const navigate = useNavigate(); const { tenant } = useCurrentTenant(); const user = useCurrentUser();
  const access = useCan({ resource: "payslips", action: "PAYSLIP_VIEW" });
  const query = useCustom<PayslipDto[], ApiHttpError>({ url: payslipApi.mine, method: "get", meta: RAW_RESPONSE_META, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && user.data?.employeeId && access.data?.can), queryKey: payslipKeys.mine(tenant?.tenantKey, user.data?.employeeId) } });
  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  if (query.isError) return query.error.statusCode === 403 ? <ForbiddenState /> : <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  return <><PageHeader title={t("payslips.mine")} />
    <Table rowKey="id" dataSource={query.data?.data ?? []} scroll={{ x: "max-content" }} pagination={{ pageSize: 10 }} locale={{ emptyText: <EmptyState /> }} columns={[
      { title: t("settlements.payPeriod"), render: (_, row) => { const s = readPayslipSnapshot(row.snapshotJson); return s ? `${formatDateOnly(s.periodStart, { locale: i18n.language })} – ${formatDateOnly(s.periodEnd, { locale: i18n.language })}` : "—"; } },
      { title: t("payroll.grossAmount"), render: (_, row) => { const s = readPayslipSnapshot(row.snapshotJson); return financialAmount(s?.calculation.grossAmount, s?.currency, i18n.language); } },
      { title: t("payroll.netAmount"), render: (_, row) => { const s = readPayslipSnapshot(row.snapshotJson); return financialAmount(s?.calculation.availability === "AVAILABLE" ? s.calculation.netAmount : null, s?.currency, i18n.language); } },
      { title: t("payslips.issuedAt"), dataIndex: "issuedAt", render: (value: string) => formatDateTime(value, { locale: i18n.language }) },
      { title: t("payroll.paymentStatus"), render: () => t("payslips.unavailable") },
      { title: t("common.actions"), render: (_, row) => <Button disabled={!isUuid(row.id)} onClick={() => navigate(routes.payslipShow.replace(":id", encodeURIComponent(row.id)))}>{t("common.view")}</Button> },
    ]} /></>;
}
