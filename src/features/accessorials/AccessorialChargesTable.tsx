/** Load-scoped accessorials and confirmed approval commands with separate money dimensions. */
import { CanAccess, useCan, useCustom } from "@refinedev/core";
import { Alert, Space, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateTime } from "@/formatters/dateTime";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { financialQueryKeys } from "@/features/profitability/profitability.api";
import { ApiHttpError } from "@/providers/api/httpError";
import type { AccessorialChargeView } from "@/types/accessorial.types";
import { useAccessorialApproval } from "./useAccessorialApproval";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export const AccessorialChargesTable = ({ loadId }: { loadId: string }) => {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const permission = useCan({ resource: "accessorials", action: "ACCESSORIAL_VIEW" });
  const approval = useAccessorialApproval(loadId);
  const query = useCustom<AccessorialChargeView[], ApiHttpError>({
    url: `/api/loads/${encodeURIComponent(loadId)}/accessorials`, method: "get", errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && loadId && permission.data?.can),
      queryKey: financialQueryKeys.accessorials(tenant?.tenantKey, loadId) },
  });
  if (query.isError) return <QueryErrorState description={query.error?.message}
    onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  const columns: ColumnsType<AccessorialChargeView> = [
    { title: t("loads.financial.type"), dataIndex: "type" },
    { title: t("finance.workflowStatus"), dataIndex: "status", render: (status: string) =>
      <StatusTag label={t(`finance.status.${status}`, { defaultValue: status })} tone={statusTone(status)} /> },
    { title: t("loads.financial.quantity"), render: (_, row) => `${row.quantity} ${row.unit} @ ${row.rate}` },
    { title: t("loads.financial.customerAmount"), dataIndex: "customerAmount", render: (amount: number | null, row) =>
      financialAmount(amount, row.currency, i18n.language) },
    { title: t("loads.financial.companyCost"), dataIndex: "companyCostAmount", render: (amount: number | null, row) =>
      financialAmount(amount, row.currency, i18n.language) },
    { title: t("loads.financial.driverPay"), dataIndex: "driverPayAmount", render: (amount: number | null, row) =>
      financialAmount(amount, row.currency, i18n.language) },
    { title: t("finance.freeQuantity"), dataIndex: "freeQuantity", render: (value: number | null) => value ?? "—" },
    { title: t("finance.evidence"), dataIndex: "documentId", render: (value: string | null) => value ?? "—" },
    { title: t("loads.financial.notes"), dataIndex: "note", render: (value: string | null) => value ?? "—" },
    { title: t("loads.financial.occurredAt"), dataIndex: "occurredAt", render: (value: string | null) =>
      formatDateTime(value, { locale: i18n.language }) },
    { title: t("columns.actions"), render: (_, row) => row.status === "PENDING_APPROVAL" &&
      <CanAccess resource="accessorials" action="ACCESSORIAL_APPROVE">
        <ConfirmActionModal triggerLabel={t("loads.financial.approve")} triggerAriaLabel={`${t("loads.financial.approve")} ${row.id}`}
          title={t("finance.confirmApproval")} description={t("finance.confirmApprovalDescription")}
          disabled={approval.pending} onConfirm={() => approval.approve(row.id)} />
      </CanAccess> },
  ];
  return <Space direction="vertical" style={{ width: "100%" }}>
    {approval.error && <Alert type="error" showIcon message={approval.error instanceof ApiHttpError
      ? t(`finance.errors.${approval.error.code}`, { defaultValue: approval.error.message }) : approval.error.message}
      description={approval.error instanceof ApiHttpError && <Typography.Text>
        {approval.error.code}{approval.error.requestId && ` / ${t("bootstrap.requestId.label")}: ${approval.error.requestId}`}
      </Typography.Text>} />}
    <Table rowKey="id" columns={columns} dataSource={query.data?.data ?? []}
      pagination={false} scroll={{ x: 1300 }} locale={{ emptyText: <EmptyState /> }} />
  </Space>;
};
