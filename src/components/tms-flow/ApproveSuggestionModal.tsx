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
          Cancel
        </Button>,
        <Button
          danger
          data-testid="suggestion-reject"
          disabled={!canDecide}
          key="reject"
          loading={actions.pending}
          onClick={() => void handleReject()}
        >
          Reject
        </Button>,
        <Button
          data-testid="suggestion-approve"
          disabled={!canDecide}
          key="approve"
          loading={actions.pending}
          onClick={() => void handleApprove()}
          type="primary"
        >
          Approve suggestion
        </Button>,
      ]}
      onCancel={onClose}
      open={open}
      title={`AI dispatch decision${load ? ` · load #${load.number}` : ""}`}
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
            <dt>Load</dt>
            <dd>
              {load
                ? `#${load.number} · ${load.name}`
                : `Decision ${suggestion.decisionId.slice(0, 8)} (load not in the loaded queue)`}
            </dd>
          </div>
          {load ? (
            <div>
              <dt>Lane</dt>
              <dd>
                {load.originCity} → {load.destinationCity}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Truck</dt>
            <dd>
              {suggestion.truckNumber ?? truck?.number ?? suggestion.truckId}
              {truck?.mainDriverName ? ` · ${truck.mainDriverName}` : ""}
            </dd>
          </div>
          <div>
            <dt>Driver</dt>
            <dd>{suggestion.driverName ?? suggestion.driverId}</dd>
          </div>
          <div>
            <dt>Rank / score</dt>
            <dd>
              #{suggestion.rank} · {Number(suggestion.score).toFixed(1)} ·{" "}
              {suggestion.confidence}
            </dd>
          </div>
          {load ? (
            <div>
              <dt>Distance</dt>
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
          <span>Approval note (optional)</span>
          <Input.TextArea
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Context for the audit trail"
            rows={2}
            value={notes}
          />
        </label>

        <label className="tms-field">
          <span>Rejection reason (required to reject)</span>
          <Input.TextArea
            maxLength={REASON_MAX_LENGTH}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why this suggestion cannot be applied"
            rows={2}
            value={reason}
          />
        </label>
      </div>
    </Modal>
  );
}
