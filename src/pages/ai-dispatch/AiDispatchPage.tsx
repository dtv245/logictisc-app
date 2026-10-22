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
  RobotOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useCan } from "@refinedev/core";
import { Alert, Button, Space, Spin, Tabs, Tag } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { ForbiddenState } from "@/components/ErrorStates";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { AiDispatchRunForm } from "@/features/ai-dispatch/components/AiDispatchRunForm";
import { AiMovementPlanCard } from "@/features/ai-dispatch/components/AiMovementPlanCard";
import { AiDispatchHistoryTable } from "@/features/ai-dispatch/components/AiDispatchHistoryTable";
import { AiConfigModal } from "@/features/ai-dispatch/components/AiConfigModal";
import type { AiMovementPlan } from "@/features/ai-dispatch/types/ai-dispatch.types";
import { useAiSettings } from "@/features/ai-dispatch/hooks/aiConfigStorage";
import { useAiDispatchActions } from "@/features/ai-dispatch/hooks/useAiDispatchActions";
import "@/features/ai-dispatch/styles/ai-dispatch.scss";

export function AiDispatchPage() {
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "ai-dispatch", action: "AI_DISPATCH_VIEW" });
  const [searchParams, setSearchParams] = useSearchParams();
  // Alias /ai-dispatch/:id và /ai-dispatch/show/:id dùng :id làm session ID.
  // Query sessionId vẫn là canonical và được ưu tiên khi có cả hai.
  const { id: pathSessionId } = useParams<{ id?: string }>();
  const sessionId = searchParams.get("sessionId") ?? pathSessionId;
  const actions = useAiDispatchActions({
    sessionId: sessionId ?? undefined,
    decisionId: searchParams.get("decisionId") ?? undefined,
  });
  const { activeProviderConfig, isConfigured } = useAiSettings();
  const [activeTab, setActiveTab] = useState<string>("plan");
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const openPlan = (plan: AiMovementPlan) => {
    setActiveTab("plan");
    if (!plan.sessionId) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("sessionId", plan.sessionId);
      next.set("decisionId", plan.id);
      return next;
    }, { replace: true });
  };

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
      children: actions.initialLoadPending && !actions.activePlan ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spin aria-label={t("asyncState.loading")} />
        </div>
      ) : actions.initialLoadError && !actions.activePlan ? null : (
        searchParams.get("decisionId") && !actions.activePlan ? (
          <Alert
            type="warning"
            showIcon
            message={t("aiDispatch.decisionNotFound")}
            action={
              <Button
                size="small"
                onClick={actions.retryInitialLoad}
                disabled={actions.initialLoadPending}
              >
                {t("actions.retry")}
              </Button>
            }
          />
        ) : (
          <AiMovementPlanCard
            plan={actions.activePlan}
            actions={actions}
            onNavigateToRun={() => setActiveTab("run")}
          />
        )
      ),
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
          onPlanCreated={openPlan}
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
            const selected = actions.plans.find((plan) => plan.id === id);
            actions.selectPlan(id);
            setActiveTab("plan");
            if (selected) openPlan(selected);
          }}
        />
      ),
    },
  ];

  return (
    <Space
      direction="vertical"
      size="large"
      className="ai-dispatch-page"
      style={{ width: "100%", maxWidth: "100%" }}
    >
      <PageHeader
        title={t("aiDispatch.title")}
        description={t("aiDispatch.subtitle")}
        extra={
          <Space wrap align="center">
            <Tag
              color={isConfigured ? "blue" : "warning"}
              icon={<RobotOutlined />}
              style={{
                padding: "4px 8px",
                fontSize: 13,
                maxWidth: "100%",
                whiteSpace: "normal",
                height: "auto",
              }}
            >
              {activeProviderConfig.name}: {activeProviderConfig.model}
              {!isConfigured && ` (${t("aiDispatch.providerNotConfigured")})`}
            </Tag>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigModalOpen(true)}
              data-testid="btn-open-ai-config"
            >
              {t("aiDispatch.configButton")}
            </Button>
          </Space>
        }
      />

      {actions.error && (
        <Alert
          type="error"
          showIcon
          closable
          message={t("common.error")}
          description={actions.error.message || String(actions.error)}
          style={{ width: "100%" }}
        />
      )}

      {actions.initialLoadError && (
        <Alert
          type="error"
          showIcon
          message={t("aiDispatch.initialLoadError")}
          description={actions.initialLoadError.message || t("queryError.description")}
          action={
            <Button
              size="small"
              onClick={actions.retryInitialLoad}
              disabled={actions.initialLoadPending}
            >
              {t("actions.retry")}
            </Button>
          }
          style={{ width: "100%" }}
        />
      )}

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

      <AiConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </Space>
  );
}
