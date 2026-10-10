/**
 * Màn hình Điều phối thông minh bằng AI (AI Smart Vehicle Dispatch).
 * Cho phép người dùng:
 * 1. Khởi chạy AI điều phối xe (chia 2 section chuẩn checklist).
 * 2. Xem chi tiết Kế hoạch di chuyển (Movement Plan) với lộ trình chặng dừng, xe & tài xế, lý giải AI.
 * 3. Phê duyệt hoặc từ chối kế hoạch di chuyển.
 */
import {
  CompassOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useCan } from "@refinedev/core";
import { Alert, Space, Spin, Tabs } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ForbiddenState } from "@/components/ErrorStates";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { AiDispatchRunForm } from "@/features/ai-dispatch/components/AiDispatchRunForm";
import { AiMovementPlanCard } from "@/features/ai-dispatch/components/AiMovementPlanCard";
import { AiDispatchHistoryTable } from "@/features/ai-dispatch/components/AiDispatchHistoryTable";
import { useAiDispatchActions } from "@/features/ai-dispatch/useAiDispatchActions";

export function AiDispatchPage() {
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "ai-dispatch", action: "AI_DISPATCH_VIEW" });
  const actions = useAiDispatchActions();
  const [activeTab, setActiveTab] = useState<string>("plan");

  if (access.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin aria-label={t("asyncState.loading")} />
      </div>
    );
  }

  if (!tenant?.tenantKey || access.data?.can === false) {
    return <ForbiddenState />;
  }

  const tabItems = [
    {
      key: "plan",
      label: (
        <Space>
          <CompassOutlined />
          <span>{t("aiDispatch.movementPlanTab")}</span>
        </Space>
      ),
      children: <AiMovementPlanCard plan={actions.activePlan} actions={actions} />,
    },
    {
      key: "run",
      label: (
        <Space>
          <PlayCircleOutlined />
          <span>{t("aiDispatch.newPlanTab")}</span>
        </Space>
      ),
      children: (
        <AiDispatchRunForm
          actions={actions}
          onPlanCreated={() => setActiveTab("plan")}
        />
      ),
    },
    {
      key: "history",
      label: (
        <Space>
          <HistoryOutlined />
          <span>{t("aiDispatch.historyTab")}</span>
        </Space>
      ),
      children: (
        <AiDispatchHistoryTable
          actions={actions}
          onSelectPlan={(id) => {
            actions.selectPlan(id);
            setActiveTab("plan");
          }}
        />
      ),
    },
  ];

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", maxWidth: "100%" }}
    >
      <PageHeader
        title={t("aiDispatch.title")}
        description={t("aiDispatch.subtitle")}
      />

      <Alert
        type="info"
        showIcon
        message={t("aiDispatch.runHelp")}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </Space>
  );
}
