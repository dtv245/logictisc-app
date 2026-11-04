import { useCan } from "@refinedev/core";
import { Alert, Button, Input, Modal } from "antd";
import { useState } from "react";

import { useAiDecisionActions } from "@/hooks/tms-flow/useAiDecisionActions";
import type { TmsApproval } from "@/types/tms-flow/tmsFlow.types";
import {
  describeSuggestionMetrics,
  formatTmsDistance,
} from "@/utils/tms-flow/presentation";

export interface ApproveSuggestionModalProps {
  approval: TmsApproval;
  open: boolean;
  onClose: () => void;
}

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

export function ApproveSuggestionModal({
  approval,
  open,
  onClose,
}: ApproveSuggestionModalProps) {
  const actions = useAiDecisionActions();
  const access = useCan({
    resource: "ai-dispatch",
    action: "AI_DISPATCH_APPROVE",
  });
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { suggestion, load, truck } = approval;
  const canDecide = Boolean(access.data?.can) && !actions.pending;
  const metrics = describeSuggestionMetrics(suggestion.metrics);

  const handleApprove = async () => {
    if (!canDecide) return;
    setLocalError(null);
    try {
      await actions.approve({ decisionId: suggestion.decisionId, notes });
      onClose();
    } catch {
      // actions.error keeps the dialog open with the backend message.
    }
  };

  const handleReject = async () => {
    if (!canDecide) return;
    const trimmed = reason.trim();
    if (trimmed.length < REASON_MIN_LENGTH || trimmed.length > REASON_MAX_LENGTH) {
      setLocalError(
        `Rejection reason must be ${REASON_MIN_LENGTH}–${REASON_MAX_LENGTH} characters.`,
      );
      return;
    }
    setLocalError(null);
    try {
      await actions.reject({ decisionId: suggestion.decisionId, reason: trimmed });
      onClose();
    } catch {
      // actions.error keeps the dialog open with the backend message.
    }
  };

  const error = localError ?? actions.error?.message ?? null;

  return (
    <Modal
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose} disabled={actions.pending}>
          Hủy
        </Button>,
        <Button
          danger
          data-testid="suggestion-reject"
          disabled={!canDecide}
          key="reject"
          loading={actions.pending}
          onClick={() => void handleReject()}
        >
          Từ chối
        </Button>,
        <Button
          data-testid="suggestion-approve"
          disabled={!canDecide}
          key="approve"
          loading={actions.pending}
          onClick={() => void handleApprove()}
          type="primary"
        >
          Duyệt đề xuất
        </Button>,
      ]}
      onCancel={onClose}
      open={open}
      title={`Đề xuất điều phối AI${load ? ` · lô #${load.number}` : ""}`}
      width={560}
    >
      <div className="tms-stack">
        {error ? (
          <Alert
            description={
              !localError && actions.error?.code
                ? `Code: ${actions.error.code}`
                : undefined
            }
            message={error}
            role="alert"
            showIcon
            type="error"
          />
        ) : null}

        <dl className="tms-detail-list">
          <div>
            <dt>Lô hàng</dt>
            <dd>
              {load
                ? `#${load.number} · ${load.name}`
                : `Đề xuất ${suggestion.decisionId.slice(0, 8)} (lô hàng chưa có trong danh sách đã tải)`}
            </dd>
          </div>
          {load ? (
            <div>
              <dt>Tuyến</dt>
              <dd>
                {load.originCity} → {load.destinationCity}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Xe</dt>
            <dd>
              {suggestion.truckNumber ?? truck?.number ?? suggestion.truckId}
              {truck?.mainDriverName ? ` · ${truck.mainDriverName}` : ""}
            </dd>
          </div>
          <div>
            <dt>Tài xế</dt>
            <dd>{suggestion.driverName ?? suggestion.driverId}</dd>
          </div>
          <div>
            <dt>Xếp hạng / điểm</dt>
            <dd>
              {suggestion.rank == null ? "Chưa xếp hạng" : `Hạng #${suggestion.rank}`} · {suggestion.score == null
                ? "Chưa đủ dữ liệu đánh giá"
                : Number(suggestion.score).toFixed(1)} · {suggestion.confidence ?? "Cần xác minh"}
            </dd>
          </div>
          {load ? (
            <div>
            <dt>Quãng đường</dt>
              <dd>{formatTmsDistance(load.distance)}</dd>
            </div>
          ) : null}
        </dl>

        {metrics.length > 0 ? (
          <div className="tms-row">
            {metrics.map((metric) => (
              <span className="tms-kpi__hint" key={metric}>
                {metric}
              </span>
            ))}
          </div>
        ) : null}

        <p className="tms-muted">{suggestion.reasoning}</p>

        <label className="tms-field">
          <span>Ghi chú duyệt (không bắt buộc)</span>
          <Input.TextArea
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Thông tin bổ sung cho nhật ký duyệt"
            rows={2}
            value={notes}
          />
        </label>

        <label className="tms-field">
          <span>Lý do từ chối (bắt buộc khi từ chối)</span>
          <Input.TextArea
            maxLength={REASON_MAX_LENGTH}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Vì sao không thể áp dụng đề xuất này"
            rows={2}
            value={reason}
          />
        </label>
      </div>
    </Modal>
  );
}
