/** Lazy correction history from the verified driver/period collection; no unscoped preload. */
import { useCustom } from "@refinedev/core";
import { Button, Table } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { financialAmount } from "@/features/profitability/utils/financialDisplay";
import type { ApiHttpError } from "@/utils/httpError";
import type { DriverSettlementView } from "@/types/settlement.dto";
import { SETTLEMENT_ENDPOINTS } from "../api/settlement.api";
import { settlementKeys } from "../api/settlement.keys";

export function SettlementAdjustments({ settlement, onView }: { settlement: DriverSettlementView; onView: (id: string) => void }) {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const filters = { driverId: settlement.driverId, payPeriodId: settlement.payPeriodId };
  const query = useCustom<DriverSettlementView[], ApiHttpError>({ url: SETTLEMENT_ENDPOINTS.list, method: "get", config: { query: filters }, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey), queryKey: settlementKeys.list(tenant?.tenantKey, filters) } });
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  return (
    <div className="settlement-table-wrapper">
      <Table rowKey="id" dataSource={(query.data?.data ?? []).filter((row) => row.parentSettlementId === settlement.id)} loading={query.isLoading || query.isFetching}
        pagination={false} scroll={{ x: 650 }} locale={{ emptyText: <EmptyState /> }} size="middle" columns={[
          { title: t("settlements.settlementNumber"), dataIndex: "settlementNumber", width: 160, minWidth: 140, render: (num) => <span className="break-all">{num}</span> },
          { title: t("settlements.type"), dataIndex: "settlementType", width: 130, minWidth: 110, render: (value: string) => t(`settlements.types.${value.toLowerCase()}`) },
          { title: t("finance.workflowStatus"), dataIndex: "status", width: 140, minWidth: 120, render: (value: string) => t(`settlements.statuses.${value.toLowerCase()}`, { defaultValue: value }) },
          { title: t("settlements.net"), width: 140, minWidth: 120, align: "right", render: (_, row) => <span className="tabular-nums font-semibold">{financialAmount(row.settlementNet, row.currency, i18n.language)}</span> },
          { title: t("common.actions"), width: 100, minWidth: 90, align: "center", render: (_, row) => <Button size="small" onClick={() => onView(row.id)}>{t("common.view")}</Button> },
        ]} />
    </div>
  );
}
