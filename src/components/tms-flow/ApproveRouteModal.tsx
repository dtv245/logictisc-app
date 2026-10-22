import { Button, Input } from "antd";
import { useState } from "react";

import { ResourceModalFrame } from "@/components/resources/ResourceModalFrame";
import { StatusTag } from "@/components/StatusTag";
import type { Driver, RouteApproval, Shipment } from "@/types/tms-flow/tmsFlow.types";
import { formatDuration, formatMiles, formatTime } from "@/utils/tms-flow/format";
import { approvalStateMeta, isApprovalOpen } from "@/utils/tms-flow/presentation";

export interface ApproveRouteModalProps {
  open: boolean;
  approval?: RouteApproval;
  shipment?: Shipment;
  driver?: Driver;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onApprove: (reason?: string) => void | Promise<void>;
  onReject: (reason?: string) => void | Promise<void>;
}

export function ApproveRouteModal({
  open,
  approval,
  shipment,
  driver,
  pending = false,
  error,
  onClose,
  onApprove,
  onReject,
}: ApproveRouteModalProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const actionOpen = approval ? isApprovalOpen(approval.state) : false;

  const footer = actionOpen ? (
    <>
      <Button
        danger
        data-testid="route-approve-reject"
        disabled={pending}
        onClick={() => void onReject(reason.trim() || undefined)}
      >
        Reject
      </Button>
      <div className="tms-modal-footer__end">
        <Button disabled={pending} onClick={() => setDetailsOpen((value) => !value)}>
          {detailsOpen ? "Hide details" : "Review details"}
        </Button>
        <Button
          data-testid="route-approve-confirm"
          loading={pending}
          onClick={() => void onApprove(reason.trim() || undefined)}
          type="primary"
        >
          Approve route
        </Button>
      </div>
    </>
  ) : (
    <div className="tms-modal-footer__end">
      <Button onClick={onClose}>Close</Button>
    </div>
  );

  return (
    <ResourceModalFrame
      cancelText="Close"
      footer={footer}
      okText="Approve route"
      onCancel={onClose}
      open={open}
      subtitle={shipment ? `${shipment.id} · ${shipment.customer} · ${driver?.name ?? "Unassigned driver"}` : undefined}
      title="Approve route change"
      width={720}
    >
      <div className="tms-approval" data-testid="route-approval-dialog">
        {!approval ? (
          <p className="tms-approval__empty">This route proposal is no longer available.</p>
        ) : (
          <>
            <div className="tms-approval__headline">
              <StatusTag label={approvalStateMeta[approval.state].label} tone={approvalStateMeta[approval.state].tone} />
              <span>Requested by {approval.requestedBy}</span>
            </div>

            <div className="tms-approval__compare" role="group" aria-label="Route comparison">
              <div className="tms-approval__option">
                <span className="tms-approval__option-label">Current · {approval.currentRoute}</span>
                <strong>{formatTime(approval.currentEta)}</strong>
                <span className="tms-approval__bad">Misses the {shipment ? `${formatTime(shipment.delivery.end)} receiving window` : "receiving window"}</span>
                <small>{formatMiles(approval.currentMiles)}</small>
              </div>
              <div className="tms-approval__arrow" aria-hidden="true">→</div>
              <div className="tms-approval__option tms-approval__option--proposed">
                <span className="tms-approval__option-label">Proposed · {approval.proposedRoute}</span>
                <strong>{formatTime(approval.proposedEta)}</strong>
                <span className="tms-approval__good">Inside the receiving window</span>
                <small>{formatMiles(approval.proposedMiles)}</small>
              </div>
            </div>

            <dl className="tms-approval__metrics">
              <div>
                <dt>Time saved</dt>
                <dd>{approval.savedMinutes} min</dd>
              </div>
              <div>
                <dt>Extra distance</dt>
                <dd>+{formatMiles(approval.proposedMiles - approval.currentMiles)}</dd>
              </div>
              <div>
                <dt>Fuel impact</dt>
                <dd>+${approval.fuelDeltaUsd.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Driver HOS left</dt>
                <dd>{formatDuration(approval.hosRemainingMinutes)}</dd>
              </div>
            </dl>

            <p className="tms-approval__reason">{approval.reason}</p>

            {detailsOpen ? (
              <div className="tms-approval__details">
                <h3>Why the Route Agent recommends this</h3>
                <ul>
                  <li>The current I-80 corridor is forecast to miss the delivery window by 19 minutes.</li>
                  <li>I-680 adds {formatMiles(approval.proposedMiles - approval.currentMiles)} but saves {approval.savedMinutes} minutes.</li>
                  <li>Marcus keeps {formatDuration(approval.hosRemainingMinutes)} of driving time, above the 2-hour safety floor.</li>
                  <li>Approval is recorded in the audit trail with the operator name and demo timestamp.</li>
                </ul>
                <label className="tms-field">
                  <span>Reason (optional, saved to audit)</span>
                  <Input.TextArea
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="e.g. Customer confirmed the earlier window"
                    rows={2}
                    value={reason}
                  />
                </label>
              </div>
            ) : null}

            {!actionOpen ? (
              <p className="tms-approval__locked" role="status">
                This proposal is {approvalStateMeta[approval.state].label.toLowerCase()}. No further action is available.
              </p>
            ) : null}

            {error ? (
              <p className="tms-approval__error" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </ResourceModalFrame>
  );
}
