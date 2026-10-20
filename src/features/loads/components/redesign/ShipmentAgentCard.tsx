import React, { useState } from "react";
import { Alert, Button, Modal, Form, Input, Spin } from "antd";
import { CheckCircleFilled, ThunderboltFilled } from "@ant-design/icons";
import { useLoadAiDispatch } from "@/hooks/ai/useLoadAiDispatch";
import type { AiDispatchCandidate } from "@/api/ai/ai.types";
import { useTranslation } from "react-i18next";

export interface ShipmentAgentCardProps {
  loadId: string;
}

export const ShipmentAgentCard: React.FC<ShipmentAgentCardProps> = ({ loadId }) => {
  const { t } = useTranslation();
  const {
    rankingSource,
    suggestions,
    capabilities,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    approveSuggestion,
    isApproving,
    rejectSuggestion,
    isRejecting,
  } = useLoadAiDispatch({ loadId });

  // Approve dialog
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<AiDispatchCandidate | null>(null);

  // Reject dialog
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectForm] = Form.useForm<{ reason: string; substituteDriverId?: string }>();

  const activeSuggestion = suggestions[0];
  const canApprove = Boolean(capabilities?.canApprove);
  const canReject = Boolean(capabilities?.canReject);

  const handleOpenApprove = (cand: AiDispatchCandidate) => {
    setSelectedCandidate(cand);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedCandidate) return;
    try {
      await approveSuggestion(selectedCandidate.id);
      setApproveModalOpen(false);
      setSelectedCandidate(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleOpenReject = (cand: AiDispatchCandidate) => {
    setSelectedCandidate(cand);
    rejectForm.resetFields();
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedCandidate) return;
    try {
      const values = await rejectForm.validateFields();
      await rejectSuggestion({
        suggestionId: selectedCandidate.id,
        reason: values.reason,
        substituteDriverId: values.substituteDriverId,
      });
      setRejectModalOpen(false);
      setSelectedCandidate(null);
    } catch {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="shipment-card shipment-card--agent" style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
        <Spin tip={t("loads.redesign.agentLoading")} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="shipment-card shipment-card--agent">
        <Alert
          type="error"
          showIcon
          message={t("loads.redesign.agentLoadFailed")}
          description={error instanceof Error ? error.message : undefined}
          action={<Button size="small" disabled={isFetching} onClick={() => void refetch()}>{t("actions.retry")}</Button>}
        />
      </div>
    );
  }

  if (!activeSuggestion) {
    return (
      <div className="shipment-card shipment-card--agent" data-testid="shipment-agent-card-empty">
        <div className="agent-card__header">
          <div className="agent-card__badge">
            <ThunderboltFilled /> {t("loads.redesign.agentName")}
          </div>
          <span className="agent-card__meta">{t("loads.redesign.agentReady")}</span>
        </div>
        <div style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)", padding: "12px 0" }}>
          {t("loads.redesign.noAgentSuggestion")}
        </div>
      </div>
    );
  }

  const confidencePercent = typeof activeSuggestion.confidenceScore === "number"
    ? Math.round(activeSuggestion.confidenceScore * 100)
    : null;

  const utilities = activeSuggestion.utilities;
  const hasUtilityMetrics = Boolean(utilities?.onTime || utilities?.margin || utilities?.deadhead);
  const isExecuted =
    activeSuggestion.status === "executed" ||
    activeSuggestion.status === "Executed" ||
    activeSuggestion.status === "approved" ||
    activeSuggestion.status === "Approved";

  return (
    <div className="shipment-card shipment-card--agent" data-testid="shipment-agent-card">
      {/* Header */}
      <div className="agent-card__header">
        <div className="agent-card__badge">
          <ThunderboltFilled /> {t("loads.redesign.routeAgent")}
        </div>
        <span className="agent-card__meta">
          {confidencePercent != null ? `${t("loads.redesign.confidenceLabel")} ${confidencePercent}% · ` : ""}
          {rankingSource === "llm" ? t("loads.redesign.llmSource") : t("loads.redesign.algorithmSource")}
        </span>
      </div>

      {/* Title */}
      <div className="agent-card__title">
        {t("loads.redesign.dispatchSuggestion", { driver: activeSuggestion.driverName, truck: activeSuggestion.truckNumber })}
      </div>

      {/* Reasoning (Phân tích AI) */}
      {activeSuggestion.reasoning && (
        <div className="agent-card__section">
          <div className="agent-card__label">{t("loads.redesign.aiAnalysisLabel")}</div>
          <div className="agent-card__content">{activeSuggestion.reasoning}</div>
        </div>
      )}

      {/* Utilities / Metrics Strip */}
      {hasUtilityMetrics && (
        <div className="agent-card__metrics-strip">
          {utilities?.onTime && <div className="agent-card__metric-item">
            <div className="agent-card__metric-value agent-card__metric-value--green">
              {`${Math.round(utilities.onTime.score)}%`}
            </div>
            <div className="agent-card__metric-desc">{t("loads.redesign.onTimeScore")}</div>
          </div>}

          {utilities?.margin && <div className="agent-card__metric-item">
            <div className="agent-card__metric-value agent-card__metric-value--green">
              {utilities.margin.displayValue || `${Math.round(utilities.margin.score)}%`}
            </div>
            <div className="agent-card__metric-desc">{t("loads.redesign.marginScore")}</div>
          </div>}

          {utilities?.deadhead && <div className="agent-card__metric-item">
            <div className="agent-card__metric-value">
              {`${Math.round(utilities.deadhead.score)}%`}
            </div>
            <div className="agent-card__metric-desc">{t("loads.redesign.deadheadScore")}</div>
          </div>}
        </div>
      )}

      {/* Footer: Approved State or Action Buttons */}
      {isExecuted ? (
        <div className="agent-card__footer">
          <CheckCircleFilled style={{ color: "var(--color-success-text)", fontSize: "var(--font-size-md)" }} />
          <span>
            {t("loads.redesign.suggestionApproved")}
          </span>
        </div>
      ) : (
        <div className="agent-card__actions">
          {canApprove && (
            <Button
              type="primary"
              style={{
                backgroundColor: "#7C3AED",
                borderColor: "#7C3AED",
                borderRadius: "var(--radius-2xl)",
                fontWeight: 700,
                flex: 1,
                height: 40,
              }}
              loading={isApproving}
              onClick={() => handleOpenApprove(activeSuggestion)}
              data-testid="agent-approve-btn"
            >
              {t("loads.redesign.approveSuggestion")}
            </Button>
          )}

          {canReject && (
            <Button
              danger
              style={{
                borderRadius: "var(--radius-2xl)",
                fontWeight: 600,
                height: 40,
              }}
              loading={isRejecting}
              onClick={() => handleOpenReject(activeSuggestion)}
              data-testid="agent-reject-btn"
            >
              {t("loads.redesign.rejectSuggestion")}
            </Button>
          )}
        </div>
      )}

      {/* Modal Duyệt */}
      <Modal
        title={t("loads.redesign.approveTitle")}
        open={approveModalOpen}
        onOk={handleConfirmApprove}
        onCancel={() => setApproveModalOpen(false)}
        confirmLoading={isApproving}
        okText={t("loads.redesign.approveConfirm")}
        cancelText={t("actions.close")}
      >
        <p>
          {t("loads.redesign.approveDescription")}
        </p>
      </Modal>

      {/* Modal Từ chối */}
      <Modal
        title={t("loads.redesign.rejectTitle")}
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={isRejecting}
        okText={t("loads.redesign.rejectConfirm")}
        cancelText={t("actions.cancel")}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label={t("loads.redesign.rejectReason")}
            rules={[{ required: true, message: t("loads.redesign.rejectReasonRequired") }]}
          >
            <Input.TextArea rows={3} placeholder={t("loads.redesign.rejectReasonPlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
