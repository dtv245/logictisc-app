import { Show } from "@refinedev/antd";
import { useCan, useShow } from "@refinedev/core";
import { Alert, Button, Space, Tabs, Tag, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LoadDocumentsPanel } from "@/features/loads/LoadDocumentsPanel";
import { LoadExceptionsPanel } from "@/features/loads/LoadExceptionsPanel";
import { LoadFinancialPanel } from "@/features/loads/LoadFinancialPanel";
import { LoadOverviewPanel } from "@/features/loads/LoadOverviewPanel";
import { LoadTimelinePanel } from "@/features/loads/LoadTimelinePanel";
import { LoadTripPanel } from "@/features/loads/LoadTripPanel";
import type { ApiError } from "@/types/api.types";
import type { Load } from "@/types/load.types";

import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";

export const LoadShow = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow<Load, ApiError>({ resource: "loads" });
  const [activeTab, setActiveTab] = useState<string>("overview");
  const costAccess = useCan({ resource: "shipment-costs", action: "COST_VIEW" });
  const accessorialAccess = useCan({ resource: "accessorials", action: "ACCESSORIAL_VIEW" });
  const canViewFinancial = costAccess.data?.can === true || accessorialAccess.data?.can === true;

  const load = queryResult.data?.data;
  const loadId = load?.id ? String(load.id) : "";

  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry")}
          </Button>
        }
        description={queryResult.error?.message}
        message={t("crud.loadError")}
        showIcon
        type="error"
      />
    );
  }

  if (queryResult.isLoading || !load) {
    return (
      <Show isLoading={true}>
        <div style={{ minHeight: 200 }} />
      </Show>
    );
  }

  const tabItems = [
    {
      key: "overview",
      label: t("loads.tabs.overview", "Overview"),
      children: activeTab === "overview" ? <LoadOverviewPanel load={load} /> : null,
    },
    {
      key: "timeline",
      label: t("loads.tabs.timeline", "Timeline"),
      children:
        activeTab === "timeline" ? (
          <LoadTimelinePanel loadId={loadId} />
        ) : null,
    },
    {
      key: "financial",
      label: t("loads.tabs.financial", "Financials & Costs"),
      children:
        activeTab === "financial" ? (
          <LoadFinancialPanel
            loadId={loadId}
          />
        ) : null,
    },
    {
      key: "documents",
      label: t("loads.tabs.documents", "Documents"),
      children:
        activeTab === "documents" ? (
          <LoadDocumentsPanel key={loadId} loadId={loadId} />
        ) : null,
    },
    {
      key: "trip",
      label: t("loads.tabs.trip", "Trip & Truck"),
      children: activeTab === "trip" ? <LoadTripPanel load={load} /> : null,
    },
    {
      key: "exceptions",
      label: t("loads.tabs.exceptions", "Exceptions"),
      children:
        activeTab === "exceptions" ? (
          <LoadExceptionsPanel loadId={loadId} />
        ) : null,
    },
  ].filter((item) => item.key !== "financial" || canViewFinancial);

  return (
    <Show
      isLoading={queryResult.isLoading}
      title={
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {load.name || t("resources.loads", "Load")} #{load.number}
          </Typography.Title>
          <StatusTag label={load.status} tone={statusTone(load.status)} />
          {load.assignedTruckNumber && (
            <Tag color="cyan">🚛 {load.assignedTruckNumber}</Tag>
          )}
          {load.deliveryCostAmount != null && load.deliveryCostCurrency && (
            <Tag color="green">
              💰 {Number(load.deliveryCostAmount).toLocaleString()}{" "}
              {load.deliveryCostCurrency}
            </Tag>
          )}
        </Space>
      }
      data-testid="load-show-page"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        data-testid="load-detail-tabs"
      />
    </Show>
  );
};
