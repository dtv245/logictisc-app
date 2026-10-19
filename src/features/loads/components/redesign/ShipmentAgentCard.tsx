import React, { useState } from "react";
import { Button, Modal, Form, Input, Spin } from "antd";
import { CheckCircleFilled, ThunderboltFilled } from "@ant-design/icons";
import { useLoadAiDispatch } from "@/hooks/ai/useLoadAiDispatch";
import type { AiDispatchCandidate } from "@/api/ai/ai.types";

export interface ShipmentAgentCardProps {
  loadId: string;
}

export const ShipmentAgentCard: React.FC<ShipmentAgentCardProps> = ({ loadId }) => {
  const {
    rankingSource,
    suggestions,
    capabilities,
    isLoading,
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
      <div className="shipment-card shipment-card--agent" style={{ textAlign: "center", padding: 32 }}>
        <Spin tip="Đang tải dữ liệu Agent AI..." />
      </div>
    );
  }

  if (!activeSuggestion) {
    return (
      <div className="shipment-card shipment-card--agent" data-testid="shipment-agent-card-empty">
        <div className="agent-card__header">
          <div className="agent-card__badge">
            <ThunderboltFilled /> LogisticsX AI Agent
          </div>
          <span className="agent-card__meta">Trạng thái: Sẵn sàng</span>
        </div>
        <div style={{ color: "#64748B", fontSize: 13, padding: "12px 0" }}>
          Hệ thống đang theo dõi hành trình. Chưa có đề xuất điều phối mới cho chuyến hàng này.
        </div>
      </div>
    );
  }

  const confidencePercent = activeSuggestion.confidenceScore
    ? Math.round(activeSuggestion.confidenceScore * 100)
    : Math.round((activeSuggestion.score || 0.9) * 100);

  const utilities = activeSuggestion.utilities;
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
          <ThunderboltFilled /> Điều Phối Tuyến (Route Agent)
        </div>
        <span className="agent-card__meta">
          {confidencePercent}% tin cậy · {rankingSource === "llm" ? "Mô hình LLM" : "Thuật toán"}
        </span>
      </div>

      {/* Title */}
      <div className="agent-card__title">
        Phương án điều phối: {activeSuggestion.driverName} (Xe {activeSuggestion.truckNumber})
      </div>

      {/* Reasoning (Phân tích AI) */}
      {activeSuggestion.reasoning && (
        <div className="agent-card__section">
          <div className="agent-card__label">PHÂN TÍCH AI</div>
          <div className="agent-card__content">{activeSuggestion.reasoning}</div>
        </div>
      )}

      {/* Utilities / Metrics Strip */}
      {utilities && (
        <div className="agent-card__metrics-strip">
          <div className="agent-card__metric-item">
            <div className="agent-card__metric-value agent-card__metric-value--green">
              {utilities.onTime ? `${Math.round(utilities.onTime.score)}%` : "Tối ưu"}
            </div>
            <div className="agent-card__metric-desc">Đúng giờ (On-time)</div>
          </div>

          <div className="agent-card__metric-item">
            <div className="agent-card__metric-value agent-card__metric-value--green">
              {utilities.margin ? utilities.margin.displayValue || `${Math.round(utilities.margin.score)}%` : "Tốt"}
            </div>
            <div className="agent-card__metric-desc">Lợi nhuận (Margin)</div>
          </div>

          <div className="agent-card__metric-item">
            <div className="agent-card__metric-value">
              {utilities.deadhead ? `${Math.round(utilities.deadhead.score)}%` : "0%"}
            </div>
            <div className="agent-card__metric-desc">Chạy rỗng (Deadhead)</div>
          </div>
        </div>
      )}

      {/* Footer: Approved State or Action Buttons */}
      {isExecuted ? (
        <div className="agent-card__footer">
          <CheckCircleFilled style={{ color: "#16A34A", fontSize: 16 }} />
          <span>
            Đã duyệt đề xuất phương án điều phối này · Đã ghi nhận vào nhật ký hệ thống
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
                borderRadius: 20,
                fontWeight: 700,
                flex: 1,
                height: 40,
              }}
              loading={isApproving}
              onClick={() => handleOpenApprove(activeSuggestion)}
              data-testid="agent-approve-btn"
            >
              Phê Duyệt Đề Xuất
            </Button>
          )}

          {canReject && (
            <Button
              danger
              style={{
                borderRadius: 20,
                fontWeight: 600,
                height: 40,
              }}
              loading={isRejecting}
              onClick={() => handleOpenReject(activeSuggestion)}
              data-testid="agent-reject-btn"
            >
              Từ Chối
            </Button>
          )}
        </div>
      )}

      {/* Modal Duyệt */}
      <Modal
        title="Xác nhận phê duyệt đề xuất điều phối"
        open={approveModalOpen}
        onOk={handleConfirmApprove}
        onCancel={() => setApproveModalOpen(false)}
        confirmLoading={isApproving}
        okText="Xác nhận duyệt"
        cancelText="Đóng"
      >
        <p>
          Bạn có chắc chắn muốn áp dụng đề xuất phương án điều phối này cho chuyến hàng?
        </p>
      </Modal>

      {/* Modal Từ chối */}
      <Modal
        title="Từ chối đề xuất điều phối"
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={isRejecting}
        okText="Gửi từ chối"
        cancelText="Hủy"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập lý do điều phối viên từ chối phương án này..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
