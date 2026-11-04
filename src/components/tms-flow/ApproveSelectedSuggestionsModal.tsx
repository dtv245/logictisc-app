import { useCan } from "@refinedev/core";
import { Alert, Button, Modal, Tag } from "antd";
import { useState } from "react";

import { useAiDecisionActions } from "@/hooks/tms-flow/useAiDecisionActions";
import type { TmsApproval } from "@/types/tms-flow/tmsFlow.types";
import { describeSuggestionMetrics } from "@/utils/tms-flow/presentation";

export interface ApproveSelectedSuggestionsModalProps {
  approvals: readonly TmsApproval[];
  onClose: () => void;
  open: boolean;
}

/** Applies each selected approval through the existing single-decision API. */
export function ApproveSelectedSuggestionsModal({
  approvals,
  onClose,
  open,
}: ApproveSelectedSuggestionsModalProps) {
  const actions = useAiDecisionActions();
  const access = useCan({
    resource: "ai-dispatch",
    action: "AI_DISPATCH_APPROVE",
  });
  const [completed, setCompleted] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const canDecide = Boolean(access.data?.can) && !actions.pending;

  const approveSelected = async () => {
    if (!canDecide || approvals.length === 0) return;
    setCompleted(0);
    setLocalError(null);
    actions.clearError();
    let successCount = 0;

    for (const approval of approvals) {
      try {
        await actions.approve({
          decisionId: approval.suggestion.decisionId,
          notes: "Đã xác nhận từ danh sách duyệt AI.",
        });
        successCount += 1;
        setCompleted(successCount);
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Lỗi không xác định.";
        setLocalError(
          `Đã áp dụng ${successCount} trên ${approvals.length} đề xuất. Dừng tại đề xuất tiếp theo: ${detail}`,
        );
        return;
      }
    }

    onClose();
  };

  return (
    <Modal
      destroyOnClose
      footer={[
        <Button disabled={actions.pending} key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          disabled={!canDecide || approvals.length === 0}
          key="confirm"
          loading={actions.pending}
          onClick={() => void approveSelected()}
          type="primary"
        >
          Xác nhận gán {approvals.length} chuyến
        </Button>,
      ]}
      keyboard={!actions.pending}
      maskClosable={!actions.pending}
      onCancel={() => {
        if (!actions.pending) onClose();
      }}
      open={open}
      title="Xác nhận đề xuất điều phối AI"
      width={640}
    >
      <div className="tms-stack">
        <Alert
          message="Các đề xuất sẽ được duyệt lần lượt"
          description="Mỗi đề xuất được gửi bằng API duyệt hiện có. Nếu một đề xuất lỗi, các đề xuất đã duyệt trước đó vẫn giữ nguyên và quá trình sẽ dừng lại."
          showIcon
          type="info"
        />
        {localError ? <Alert message={localError} showIcon type="error" /> : null}
        {!access.isLoading && !access.data?.can ? (
          <Alert message="Bạn không có quyền duyệt điều phối AI." showIcon type="warning" />
        ) : null}
        <div className="tms-bulk-approval-list">
          {approvals.map((approval) => {
            const { suggestion, load, truck } = approval;
            const driver = suggestion.driverName ?? truck?.mainDriverName;
            const truckName = suggestion.truckNumber ?? truck?.number ?? suggestion.truckId;
            const metrics = describeSuggestionMetrics(suggestion.metrics);

            return (
              <article className="tms-bulk-approval" key={suggestion.decisionId}>
                <div className="tms-bulk-approval__header">
                  <strong>
                    {load
                      ? `#${load.number} · ${load.originCity} → ${load.destinationCity}`
                      : `Đề xuất ${suggestion.decisionId.slice(0, 8)}`}
                  </strong>
                  <Tag color={suggestion.score == null ? undefined : "purple"}>
                    {suggestion.score == null
                      ? "Chưa đủ dữ liệu đánh giá"
                      : `Điểm ${Number(suggestion.score).toFixed(1)}`}
                  </Tag>
                </div>
                <div className="tms-muted">
                  Xe {truckName}{driver ? ` · Tài xế ${driver}` : ""} · {suggestion.rank == null ? "Chưa xếp hạng" : `Hạng #${suggestion.rank}`}
                </div>
                <p>{suggestion.reasoning}</p>
                {metrics.length > 0 ? (
                  <div className="tms-row">
                    {metrics.map((metric) => (
                      <span className="tms-kpi__hint" key={metric}>{metric}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        {completed > 0 && localError ? (
          <p aria-live="polite" className="tms-muted">
            Đã duyệt thành công {completed} đề xuất trước khi dừng.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
