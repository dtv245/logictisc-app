/** Reads the current load's costs, keeping cost basis separate from workflow status. */
import { useCan, useCustom } from "@refinedev/core";
import { Button, Input, Modal, Space, Spin, Table, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/ErrorStates";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { formatDateTime } from "@/formatters/dateTime";
import { financialAmount } from "@formatters/financialDisplay";
import { financialQueryKeys } from "@/features/profitability";
import { useShipmentCostWorkflow } from "@/features/shipment-costs/hooks/useShipmentCostWorkflow";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { ApiResponse } from "@/types/api.types";
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import type { ApiHttpError } from "@/utils/httpError";
import { readApiResponse } from "@/utils/envelope";
import type { ShipmentCostView } from "@/types/shipment-costs/shipmentCost.types";

export const ShipmentCostTable = ({ loadId }: { loadId: string }) => {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const tenantKey = tenant?.tenantKey;
  const permission = useCan({ resource: "shipment-costs", action: "COST_VIEW" });
  const workflow = useShipmentCostWorkflow(loadId);
  const [page, setPage] = useState(DEFAULT_LIST_PAGE);
  const [voidTarget, setVoidTarget] = useState<ShipmentCostView | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [actionError, setActionError] = useState<Error | null>(null);

  // The cost list is an enveloped, server-paginated endpoint: raw mode keeps
  // `meta.pagination`, which the default envelope adapter unwraps away.
  const query = useCustom<ApiResponse<ShipmentCostView[]>, ApiHttpError>({
    url: `/api/loads/${encodeURIComponent(loadId)}/costs`,
    method: "get",
    meta: RAW_RESPONSE_META,
    config: { query: { page, pageSize: DEFAULT_LIST_PAGE_SIZE } },
    errorNotification: false,
    queryOptions: {
      enabled: Boolean(tenantKey && loadId && permission.data?.can),
      queryKey: [...financialQueryKeys.costs(tenantKey, loadId), page],
      keepPreviousData: true,
    },
  });

  if (query.isError) return <QueryErrorState description={query.error?.message}
    onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;

  // Refine wraps the custom result as `{ data }`; in raw mode that payload is
  // still the full HTTP envelope, so unwrap one level before validating it.
  const envelope = query.data ? readApiResponse(query.data.data) : null;
  if (query.data && !envelope) {
    return <QueryErrorState description={t("loads.financial.loadFailed")}
      onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  const rows = (envelope?.data as ShipmentCostView[] | null | undefined) ?? [];
  const pagination = envelope?.meta.pagination;

  const runCommand = (command: () => Promise<void>) => {
    setActionError(null);
    void command().catch((cause: unknown) =>
      setActionError(cause instanceof Error ? cause : new Error(t("loads.financial.actionFailed"))));
  };

  const columns: ColumnsType<ShipmentCostView> = [
    {
      title: t("loads.financial.category"),
      dataIndex: "category",
      ellipsis: true,
      render: (value: string | null) =>
        value ? (
          <Tooltip title={value}>
            <span className="table-cell-ellipsis">{value}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: t("loads.financial.costBasis"),
      dataIndex: "costBasis",
      ellipsis: true,
      render: (basis: string) => {
        const text = t(`finance.costBasis.${basis}`, { defaultValue: basis });
        return (
          <Tooltip title={text}>
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    { title: t("finance.workflowStatus"), dataIndex: "status", render: (status: string) =>
      <StatusTag label={t(`finance.status.${status}`, { defaultValue: status })} tone={statusTone(status)} /> },
    {
      title: t("finance.source"),
      dataIndex: "sourceType",
      ellipsis: true,
      render: (value: string | null) =>
        value ? (
          <Tooltip title={value}>
            <span className="table-cell-ellipsis">{value}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: t("finance.allocation"),
      dataIndex: "allocationMethod",
      ellipsis: true,
      render: (value: string | null) =>
        value ? (
          <Tooltip title={value}>
            <span className="table-cell-ellipsis">{value}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    { title: t("loads.financial.amount"), dataIndex: "amount", render: (amount: number | null, row: ShipmentCostView) =>
      financialAmount(amount, row.currency, i18n.language) },
    { title: t("finance.currency"), dataIndex: "currency" },
    { title: t("loads.financial.incurredAt"), dataIndex: "incurredAt", render: (value: string | null) =>
      formatDateTime(value, { locale: i18n.language }) },
    {
      title: t("loads.financial.notes"),
      dataIndex: "note",
      ellipsis: true,
      render: (value: string | null) =>
        value ? (
          <Tooltip title={value}>
            <span className="table-cell-ellipsis">{value}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
  ];

  if (workflow.can.verify || workflow.can.approve || workflow.can.void) {
    columns.push({
      title: t("loads.financial.actions"),
      key: "actions",
      render: (_: unknown, row: ShipmentCostView) => {
        const busy = workflow.pendingId === row.id;
        return (
          <Space size="small" wrap>
            {row.status === "DRAFT" && workflow.can.verify && (
              <Button size="small" loading={busy}
                onClick={() => runCommand(() => workflow.verify(row.id))}>
                {t("loads.financial.verify")}
              </Button>
            )}
            {row.status === "VERIFIED" && workflow.can.approve && (
              <Button size="small" type="primary" loading={busy}
                onClick={() => runCommand(() => workflow.approve(row.id))}>
                {t("loads.financial.approveCost")}
              </Button>
            )}
            {row.status !== "VOIDED" && workflow.can.void && (
              <Button size="small" danger
                onClick={() => { setVoidReason(""); setActionError(null); setVoidTarget(row); }}>
                {t("loads.financial.voidCost")}
              </Button>
            )}
          </Space>
        );
      },
    });
  }

  return (
    <>
      <Table rowKey="id" columns={columns} dataSource={rows} scroll={{ x: 1100 }}
        locale={{ emptyText: <EmptyState /> }}
        pagination={{
          current: pagination?.page ?? page,
          pageSize: pagination?.size ?? DEFAULT_LIST_PAGE_SIZE,
          total: pagination?.total ?? rows.length,
          showSizeChanger: false,
          onChange: (nextPage) => setPage(Math.max(DEFAULT_LIST_PAGE, nextPage)),
        }} />
      <Modal
        open={voidTarget !== null}
        title={t("loads.financial.voidCost")}
        okText={t("loads.financial.voidCost")}
        cancelText={t("common.cancel")}
        okButtonProps={{
          danger: true,
          loading: voidTarget !== null && workflow.pendingId === voidTarget.id,
          disabled: voidReason.trim().length === 0,
        }}
        onCancel={() => setVoidTarget(null)}
        onOk={() => {
          if (!voidTarget) return;
          runCommand(async () => {
            await workflow.voidCost(voidTarget.id, voidReason);
            setVoidTarget(null);
            setVoidReason("");
          });
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Typography.Text type="secondary">{t("loads.financial.voidReasonHint")}</Typography.Text>
          <Input.TextArea value={voidReason} onChange={(event) => setVoidReason(event.target.value)}
            placeholder={t("loads.financial.voidReasonPlaceholder")} autoSize={{ minRows: 2, maxRows: 4 }} />
          {actionError ? <Typography.Text type="danger">{actionError.message}</Typography.Text> : null}
        </Space>
      </Modal>
    </>
  );
};
