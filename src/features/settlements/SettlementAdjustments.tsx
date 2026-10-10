/** Lazy correction history from the verified driver/period collection; no unscoped preload. */
import { useCustom } from "@refinedev/core";
import { Button, Table } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { financialAmount } from "@/features/profitability/financialDisplay";
import type { ApiHttpError } from "@/providers/api/httpError";
import type { DriverSettlementView } from "@/types/settlement.dto";
import { SETTLEMENT_ENDPOINTS } from "./settlement.api";
import { settlementKeys } from "./settlement.keys";

export function SettlementAdjustments({ settlement, onView }: { settlement: DriverSettlementView; onView: (id: string) => void }) {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const filters = { driverId: settlement.driverId, payPeriodId: settlement.payPeriodId };
  const query = useCustom<DriverSettlementView[], ApiHttpError>({ url: SETTLEMENT_ENDPOINTS.list, method: "get", config: { query: filters }, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey), queryKey: settlementKeys.list(tenant?.tenantKey, filters) } });
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  return <Table rowKey="id" dataSource={(query.data?.data ?? []).filter((row) => row.parentSettlementId === settlement.id)} loading={query.isLoading || query.isFetching}
    pagination={false} scroll={{ x: "max-content" }} locale={{ emptyText: <EmptyState /> }} columns={[
      { title: t("settlements.settlementNumber"), dataIndex: "settlementNumber" },
      { title: t("settlements.type"), dataIndex: "settlementType", render: (value: string) => t(`settlements.types.${value.toLowerCase()}`) },
      { title: t("finance.workflowStatus"), dataIndex: "status", render: (value: string) => t(`settlements.statuses.${value.toLowerCase()}`, { defaultValue: value }) },
      { title: t("settlements.net"), render: (_, row) => financialAmount(row.settlementNet, row.currency, i18n.language) },
      { title: t("common.actions"), render: (_, row) => <Button onClick={() => onView(row.id)}>{t("common.view")}</Button> },
    ]} />;
}
