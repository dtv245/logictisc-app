/** Reads only the current load's costs, keeping cost basis separate from workflow status. */
import { useCan, useCustom } from "@refinedev/core";
import { Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateTime } from "@/formatters/dateTime";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { financialQueryKeys } from "@/features/profitability/profitability.api";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { ApiHttpError } from "@/providers/api/httpError";
import type { ShipmentCostView } from "@/types/shipmentCost.types";

export const ShipmentCostTable = ({ loadId }: { loadId: string }) => {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const permission = useCan({ resource: "shipment-costs", action: "COST_VIEW" });
  const query = useCustom<ShipmentCostView[], ApiHttpError>({
    url: `/api/loads/${encodeURIComponent(loadId)}/costs`, method: "get", errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && loadId && permission.data?.can),
      queryKey: financialQueryKeys.costs(tenant?.tenantKey, loadId) },
  });
  if (query.isError) return <QueryErrorState description={query.error?.message}
    onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  const columns: ColumnsType<ShipmentCostView> = [
    { title: t("loads.financial.category"), dataIndex: "category" },
    { title: t("loads.financial.costBasis"), dataIndex: "costBasis",
      render: (basis: string) => t(`finance.costBasis.${basis}`, { defaultValue: basis }) },
    { title: t("finance.workflowStatus"), dataIndex: "status", render: (status: string) =>
      <StatusTag label={t(`finance.status.${status}`, { defaultValue: status })} tone={statusTone(status)} /> },
    { title: t("finance.source"), dataIndex: "sourceType" },
    { title: t("finance.allocation"), dataIndex: "allocationMethod", render: (value: string | null) => value ?? "—" },
    { title: t("loads.financial.amount"), dataIndex: "amount", render: (amount: number | null, row: ShipmentCostView) =>
      financialAmount(amount, row.currency, i18n.language) },
    { title: t("finance.currency"), dataIndex: "currency" },
    { title: t("loads.financial.incurredAt"), dataIndex: "incurredAt", render: (value: string | null) =>
      formatDateTime(value, { locale: i18n.language }) },
    { title: t("loads.financial.notes"), dataIndex: "note" },
  ];
  return <Table rowKey="id" columns={columns} dataSource={query.data?.data ?? []}
    pagination={false} scroll={{ x: 1000 }} locale={{ emptyText: <EmptyState /> }} />;
};
