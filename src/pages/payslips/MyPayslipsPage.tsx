/** Self-service listing only requests the employee-bound payslip endpoint. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom } from "@refinedev/core";
import { Button, Space, Spin, Table } from "antd";
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
import { payslipApi, payslipKeys } from "@/features/payslips/api/payslip.api";
import { readPayslipSnapshot } from "@/features/payslips/utils/payslip.snapshot";
import type { PayslipDto } from "@/types/payslip.dto";
import type { ApiHttpError } from "@/utils/httpError";
export function MyPayslipsPage() {
  const { t, i18n } = useTranslation(); const navigate = useNavigate(); const { tenant } = useCurrentTenant(); const user = useCurrentUser();
  const access = useCan({ resource: "payslips", action: "PAYSLIP_VIEW" });
  const query = useCustom<PayslipDto[], ApiHttpError>({ url: payslipApi.mine, method: "get", meta: RAW_RESPONSE_META, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && user.data?.employeeId && access.data?.can), queryKey: payslipKeys.mine(tenant?.tenantKey, user.data?.employeeId) } });
  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true) return <ForbiddenState />;
  if (query.isError) return query.error.statusCode === 403 ? <ForbiddenState /> : <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader title={t("payslips.mine")} />
      <Table
        rowKey="id"
        dataSource={query.data?.data ?? []}
        scroll={{ x: 780 }}
        pagination={{ pageSize: 10, responsive: true }}
        locale={{ emptyText: <EmptyState /> }}
        columns={[
          {
            title: t("settlements.payPeriod"),
            width: 220,
            render: (_, row) => {
              const s = readPayslipSnapshot(row.snapshotJson);
              return s ? (
                <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                  {formatDateOnly(s.periodStart, { locale: i18n.language })} – {formatDateOnly(s.periodEnd, { locale: i18n.language })}
                </span>
              ) : "—";
            },
          },
          {
            title: t("payroll.grossAmount"),
            width: 130,
            align: "right",
            render: (_, row) => {
              const s = readPayslipSnapshot(row.snapshotJson);
              return financialAmount(s?.calculation.grossAmount, s?.currency, i18n.language);
            },
          },
          {
            title: t("payroll.netAmount"),
            width: 130,
            align: "right",
            render: (_, row) => {
              const s = readPayslipSnapshot(row.snapshotJson);
              return (
                <strong style={{ color: "#1677ff", whiteSpace: "nowrap" }}>
                  {financialAmount(s?.calculation.availability === "AVAILABLE" ? s.calculation.netAmount : null, s?.currency, i18n.language)}
                </strong>
              );
            },
          },
          {
            title: t("payslips.issuedAt"),
            dataIndex: "issuedAt",
            width: 170,
            render: (value: string) => formatDateTime(value, { locale: i18n.language }),
          },
          {
            title: t("payroll.paymentStatus"),
            width: 140,
            render: () => <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{t("payslips.unavailable")}</span>,
          },
          {
            title: t("common.actions"),
            width: 110,
            fixed: "right",
            align: "center",
            render: (_, row) => (
              <Button
                disabled={!isUuid(row.id)}
                onClick={() => navigate(routes.payslipShow.replace(":id", encodeURIComponent(row.id)))}
                style={{ minHeight: 38, minWidth: 64 }}
              >
                {t("common.view")}
              </Button>
            ),
          },
        ]}
      />
    </Space>
  );
}
