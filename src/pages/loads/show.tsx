import { LoadLarkSyncPanel } from "@/components/lark-base/LoadLarkSyncPanel";
import { Show } from "@refinedev/antd";
import { useCan, useShow } from "@refinedev/core";
import { Alert, Button, Tabs } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { LoadDocumentsPanel } from "@/features/loads/components/LoadDocumentsPanel";
import { LoadExceptionsPanel } from "@/features/loads/components/LoadExceptionsPanel";
import { LoadFinancialPanel } from "@/features/loads/components/LoadFinancialPanel";
import { ShipmentDetailView } from "@/features/loads/components/redesign/ShipmentDetailView";
import { LoadTimelinePanel } from "@/features/loads/components/LoadTimelinePanel";
import { LoadTripPanel } from "@/features/loads/components/LoadTripPanel";
import { LoadAiPanel } from "@/components/ai/LoadAiPanel";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { ShipmentHeader } from "@/features/loads/components/redesign/ShipmentHeader";
import type { ApiError } from "@/types/api.types";
import type { Load } from "@/types/load.types";


export const LoadShow = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Load, ApiError>({
    resource: "loads",
    id,
    queryOptions: {
      enabled: Boolean(id),
    },
  });
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { enabled: isAiEnabled } = useAiFeatures();
  const larkAccess = useCan({ resource: "loads", action: "LARK_BASE_SYNC" });
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
    ...(larkAccess.data?.can === true ? [{ key: "lark-base", label: "Lark Base", children: activeTab === "lark-base" ? <LoadLarkSyncPanel key={loadId} loadId={loadId} /> : null }] : []),
    {
      key: "overview",
      label: t("loads.tabs.overview", "Overview"),
      children:
        activeTab === "overview" ? (
          <ShipmentDetailView load={load} />
        ) : null,
    },
    ...(isAiEnabled
      ? [
          {
            key: "ai",
            label: "🧠 Trợ lý AI",
            children: activeTab === "ai" ? <LoadAiPanel loadId={loadId} /> : null,
          },
        ]
      : []),
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
    <div className="shipment-detail-show-wrapper">
      <ShipmentHeader load={load} />
      <Show
        isLoading={queryResult.isLoading}
        breadcrumb={null}
        goBack={null}
        headerButtons={null}
        title={null}
        data-testid="load-show-page"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="shipment-tabs-modern"
          data-testid="load-detail-tabs"
        />
      </Show>
    </div>
  );
};

