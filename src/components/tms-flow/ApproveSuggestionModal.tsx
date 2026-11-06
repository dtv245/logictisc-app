import { useCan } from "@refinedev/core";
import { Alert, Button, Collapse, Input, Modal } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ApprovalAlreadyPendingError,
  PendingSuggestionChangedError,
  useAiDecisionActions,
} from "@/hooks/tms-flow/useAiDecisionActions";
import type { TmsAiSuggestion, TmsApproval } from "@/types/tms-flow/tmsFlow.types";
import { describeTmsError, formatTmsDistance } from "@/utils/tms-flow/presentation";
import {
  assessSuggestionConfidence,
  assessSuggestionScore,
  summarizeSuggestionReasoning,
} from "@/utils/tms-flow/suggestionAssessment";

export interface ApproveSuggestionModalProps {
  approval: TmsApproval;
  open: boolean;
  onClose: () => void;
  onDecisionComplete?: (approval: TmsApproval) => void;
  onSuggestionChanged?: (suggestion: TmsAiSuggestion) => void;
}

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

export function ApproveSuggestionModal({
  approval,
  open,
  onClose,
  onDecisionComplete,
  onSuggestionChanged,
}: ApproveSuggestionModalProps) {
  const { t } = useTranslation();
  const actions = useAiDecisionActions();
  const access = useCan({
    resource: "ai-dispatch",
    action: "AI_DISPATCH_APPROVE",
  });
  const [notes, setNotes] = useState("");
  const [reasonChoice, setReasonChoice] = useState<"truckFar" | "driverBusy" | "other" | "">("");
  const [otherReason, setOtherReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { suggestion, load, truck } = approval;
  const evidenceUnavailable = [suggestion.status, approval.dispatchStatus]
    .some((value) => value?.toLowerCase() === "evidence_unavailable");
  const truckLabel = truck?.licensePlate ?? suggestion.truckNumber ?? truck?.number;
  const driverName = suggestion.driverName
    ?? ([approval.driver?.firstName, approval.driver?.lastName].filter(Boolean).join(" ") || undefined)
    ?? (truck?.mainDriverId === suggestion.driverId ? truck.mainDriverName ?? undefined : undefined);
  const hasDecisionEvidence = Boolean(load && truckLabel && driverName && suggestion.decisionId)
    && !evidenceUnavailable;
  const canDecide = Boolean(access.data?.can) && !actions.pending && hasDecisionEvidence;
  const rejectionReason = reasonChoice === "other"
    ? otherReason.trim()
    : reasonChoice
      ? t(`tmsDispatch.approval.reasonOptions.${reasonChoice}`)
      : "";
  const canReject = canDecide && Boolean(reasonChoice) &&
    (reasonChoice !== "other" || (rejectionReason.length >= REASON_MIN_LENGTH && rejectionReason.length <= REASON_MAX_LENGTH));
  const scoreLevel = assessSuggestionScore(suggestion.score);
  const confidenceLevel = assessSuggestionConfidence(suggestion.confidence);
  const reasoning = summarizeSuggestionReasoning(suggestion.reasoning);

  const handleApprove = async () => {
    if (!canDecide) return;
    setLocalError(null);
    actions.clearError();
    try {
      await actions.approveIfCurrent({ decisionId: suggestion.decisionId, notes, suggestion });
      onDecisionComplete?.(approval);
      onClose();
    } catch (error) {
      if (error instanceof PendingSuggestionChangedError) {
        setLocalError(t("tmsDispatch.approval.changed"));
        if (error.current) onSuggestionChanged?.(error.current);
        return;
      }
      if (error instanceof ApprovalAlreadyPendingError) return;
      setLocalError(describeTmsError(error));
    }
  };

  const handleReject = async () => {
    if (!canReject) return;
    const trimmed = rejectionReason;
    if (trimmed.length < REASON_MIN_LENGTH || trimmed.length > REASON_MAX_LENGTH) {
      setLocalError(t("tmsDispatch.approval.reasonLength", { min: REASON_MIN_LENGTH, max: REASON_MAX_LENGTH }));
      return;
    }
    setLocalError(null);
    actions.clearError();
    try {
      await actions.reject({ decisionId: suggestion.decisionId, reason: trimmed });
      onDecisionComplete?.(approval);
      onClose();
    } catch (error) {
      setLocalError(describeTmsError(error));
    }
  };

  const error = localError ?? actions.error?.message ?? null;

  return (
    <Modal
      className="tms-approval-modal"
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose} disabled={actions.pending}>
          {t("tmsDispatch.approval.cancel")}
        </Button>,
        <Button
          danger
          data-testid="suggestion-reject"
          disabled={!canReject}
          key="reject"
          loading={actions.pending}
          onClick={() => void handleReject()}
        >
          {t("tmsDispatch.approval.reject")}
        </Button>,
        <Button
          data-testid="suggestion-approve"
          disabled={!canDecide}
          key="approve"
          loading={actions.pending}
          onClick={() => void handleApprove()}
          type="primary"
        >
          {t("tmsDispatch.approval.approve")}
        </Button>,
      ]}
      keyboard={!actions.pending}
      maskClosable={!actions.pending}
      onCancel={() => {
        if (!actions.pending) onClose();
      }}
      open={open}
      title={t("tmsDispatch.approval.title", { number: load?.number ?? "" })}
      width={560}
    >
      <div className="tms-stack">
        {!hasDecisionEvidence ? (
          <Alert
            message={t("tmsDispatch.approval.evidenceUnavailable")}
            showIcon
            type="warning"
          />
        ) : (
          <Alert
            message={t("tmsDispatch.approval.consequence", {
              number: load?.number,
              truck: truckLabel,
              driver: driverName,
            })}
            showIcon
            type="info"
          />
        )}
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
            <dt>{t("tmsDispatch.approval.fields.load")}</dt>
            <dd>
              {load
                ? `#${load.number} · ${load.name}`
                : t("tmsDispatch.approval.loadUnavailable", { id: suggestion.decisionId.slice(0, 8) })}
            </dd>
          </div>
          {load ? (
            <div>
              <dt>{t("tmsDispatch.approval.fields.route")}</dt>
              <dd>
                {load.originCity} → {load.destinationCity}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{t("tmsDispatch.approval.fields.truck")}</dt>
            <dd>
              {suggestion.truckNumber ?? truck?.number ?? suggestion.truckId}
              {truck?.mainDriverName ? ` · ${truck.mainDriverName}` : ""}
            </dd>
          </div>
          <div>
            <dt>{t("tmsDispatch.approval.fields.driver")}</dt>
            <dd>{suggestion.driverName ?? suggestion.driverId}</dd>
          </div>
          <div>
            <dt>{t("tmsDispatch.approval.fields.fit")}</dt>
            <dd>{t(`tmsDispatch.assessment.levels.${scoreLevel}`)}</dd>
          </div>
          <div>
            <dt>{t("tmsDispatch.approval.fields.confidence")}</dt>
            <dd>{t(`tmsDispatch.assessment.levels.${confidenceLevel}`)}</dd>
          </div>
          {load ? (
            <div>
            <dt>{t("tmsDispatch.approval.fields.distance")}</dt>
              <dd>{formatTmsDistance(load.distance)}</dd>
            </div>
          ) : null}
        </dl>

        <p className="tms-muted tms-approval-reason__intro">{t("tmsDispatch.approval.reasonIntro")}</p>
        <ul className="tms-approval-reason">
          {reasoning.map((sentence, index) => (
            <li key={`${index}-${sentence}`}>{sentence}</li>
          ))}
        </ul>
        <Collapse
          items={[{
            key: "technical",
            label: t("tmsDispatch.assessment.technicalDetails"),
            children: (
              <dl className="tms-technical-details">
                <div><dt>{t("tmsDispatch.approval.fields.rank")}</dt><dd>{suggestion.rank ?? t("tmsDispatch.assessment.notAvailable")}</dd></div>
                <div><dt>{t("tmsDispatch.approval.fields.rawScore")}</dt><dd>{suggestion.score ?? t("tmsDispatch.assessment.notAvailable")}</dd></div>
                <div><dt>{t("tmsDispatch.approval.fields.rawConfidence")}</dt><dd>{suggestion.confidence ?? t("tmsDispatch.assessment.notAvailable")}</dd></div>
                <div><dt>{t("tmsDispatch.approval.fields.metrics")}</dt><dd><pre>{JSON.stringify(suggestion.metrics ?? {}, null, 2)}</pre></dd></div>
                <div className="tms-technical-details__note">{t("tmsDispatch.assessment.thresholdNote")}</div>
              </dl>
            ),
          }]}
        />

        <label className="tms-field">
          <span>{t("tmsDispatch.approval.notes")}</span>
          <Input.TextArea
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("tmsDispatch.approval.notesPlaceholder")}
            rows={2}
            value={notes}
          />
        </label>

        <div className="tms-field">
          <span>{t("tmsDispatch.approval.rejectReason")}</span>
          <div className="tms-rejection-options" role="group" aria-label={t("tmsDispatch.approval.rejectReason")}>
            {(["truckFar", "driverBusy", "other"] as const).map((choice) => (
              <Button
                aria-pressed={reasonChoice === choice}
                key={choice}
                onClick={() => setReasonChoice(choice)}
                type={reasonChoice === choice ? "primary" : "default"}
              >
                {t(`tmsDispatch.approval.reasonOptions.${choice}`)}
              </Button>
            ))}
          </div>
          {reasonChoice === "other" ? (
            <Input.TextArea
              aria-label={t("tmsDispatch.approval.rejectReasonPlaceholder")}
              maxLength={REASON_MAX_LENGTH}
              onChange={(event) => setOtherReason(event.target.value)}
              placeholder={t("tmsDispatch.approval.rejectReasonPlaceholder")}
              rows={2}
              value={otherReason}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
