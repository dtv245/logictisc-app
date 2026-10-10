/**
 * Bảng lịch sử các kế hoạch điều phối AI đã tạo.
 */
import { Button, Space, Table } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import type { AiMovementPlan } from "@/types/ai-dispatch.types";
import type { AiDispatchActionsResult } from "../useAiDispatchActions";

interface Props {
  actions: AiDispatchActionsResult;
  onSelectPlan: (planId: string) => void;
}

export function AiDispatchHistoryTable({ actions, onSelectPlan }: Props) {
  const { t } = useTranslation();

  return (
    <Table
      rowKey="id"
      dataSource={actions.plans}
      pagination={{ pageSize: 10 }}
      scroll={{ x: "max-content" }}
      columns={[
        {
          title: t("aiDispatch.truck"),
          dataIndex: "truckNumber",
          render: (val: string) => <strong>{val}</strong>,
        },
        {
          title: t("aiDispatch.driver"),
          dataIndex: "driverName",
        },
        {
          title: t("aiDispatch.loadId"),
          dataIndex: "loadNumber",
        },
        {
          title: t("aiDispatch.totalDistance"),
          dataIndex: "totalDistanceMiles",
          render: (val: number) => `${val} mi`,
        },
        {
          title: t("aiDispatch.deadheadReduction"),
          dataIndex: "deadheadReductionPercent",
          render: (val: number) => `-${val}%`,
        },
        {
          title: t("aiDispatch.estimatedMargin"),
          dataIndex: "estimatedMargin",
          render: (val: number, row: AiMovementPlan) => `$${val} ${row.currency}`,
        },
        {
          title: t("columns.ai-dispatch.status"),
          dataIndex: "status",
          render: (status: AiMovementPlan["status"]) => (
            <StatusTag
              tone={
                status === "approved"
                  ? "success"
                  : status === "rejected"
                  ? "error"
                  : "warning"
              }
              label={
                status === "approved"
                  ? t("aiDispatch.statusApproved")
                  : status === "rejected"
                  ? t("aiDispatch.statusRejected")
                  : t("aiDispatch.statusProposed")
              }
            />
          ),
        },
        {
          title: t("common.actions"),
          key: "actions",
          render: (_, row: AiMovementPlan) => (
            <Space>
              <Button
                size="small"
                type={actions.activePlan?.id === row.id ? "primary" : "default"}
                onClick={() => onSelectPlan(row.id)}
              >
                {t("common.view")}
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
}
