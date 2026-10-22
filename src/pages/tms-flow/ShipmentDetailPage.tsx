import { Button } from "antd";
import { ArrowLeft, MapPin, Phone, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApproveRouteModal } from "@/components/tms-flow/ApproveRouteModal";
import { AuditTrail } from "@/components/tms-flow/AuditTrail";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { ShareTrackingModal, type ShareTrackingPayload } from "@/components/tms-flow/ShareTrackingModal";
import { StatusTag } from "@/components/StatusTag";
import { useTmsFlow } from "@/hooks/tms-flow/useTmsFlow";
import { useTmsFlowActions } from "@/hooks/tms-flow/useTmsFlowActions";
import { formatMiles, formatTime, formatWindow } from "@/utils/tms-flow/format";
import { approvalStateMeta, isApprovalOpen, shipmentStatusMeta } from "@/utils/tms-flow/presentation";
import { selectShipmentDetail } from "@/utils/tms-flow/selectors";

export function ShipmentDetailPage() {
  const { state } = useTmsFlow();
  const actions = useTmsFlowActions();
  const navigate = useNavigate();
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const [shareOpen, setShareOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);

  if (state.status !== "ready") return null;
  const { snapshot } = state;
  const detail = selectShipmentDetail(snapshot, shipmentId);

  if (!detail) {
    return (
      <div className="tms-page">
        <FlowPanel title="Shipment not found">
          <p className="tms-muted">No fixture shipment matches “{shipmentId}”.</p>
          <Button icon={<ArrowLeft size={14} aria-hidden="true" />} onClick={() => navigate("/tms/dispatch")}>
            Back to dispatch
          </Button>
        </FlowPanel>
      </div>
    );
  }

  const { shipment, driver, vehicle, route, approval, audits } = detail;
  const existingLink = snapshot.trackingLinks.find((link) => link.shipmentId === shipment.id);
  const openApproval = approval && isApprovalOpen(approval.state) ? approval : undefined;
  const progressPercent =
    shipment.status === "delivered"
      ? 100
      : shipment.id === "SF-48291"
        ? Math.round((50 / 81) * 100)
        : shipment.status === "in_transit"
          ? 40
          : 0;

  const handleShare = async (payload: ShareTrackingPayload) => {
    try {
      await actions.createTrackingLink({
        shipmentId: shipment.id,
        recipients: payload.recipients,
        preferences: payload.preferences,
      });
      setShareOpen(false);
    } catch {
      // actions.error keeps the dialog open with the message.
    }
  };

  const handleDecision = async (decision: "approve" | "reject", reason?: string) => {
    if (!approval) return;
    try {
      await actions.decideRoute(approval.id, decision, reason);
      setApprovalOpen(false);
    } catch {
      // actions.error keeps the dialog open with the message.
    }
  };

  return (
    <div className="tms-page">
      <div className="tms-row">
        <Button icon={<ArrowLeft size={14} aria-hidden="true" />} onClick={() => navigate("/tms/dispatch")} type="text">
          Dispatch
        </Button>
        <div className="tms-hero__actions">
          <Button
            disabled={!driver}
            href={driver ? `tel:${driver.phone}` : undefined}
            icon={<Phone size={14} aria-hidden="true" />}
          >
            Call driver
          </Button>
          <Button
            data-testid="shipment-share-tracking"
            disabled={!driver}
            icon={<Share2 size={14} aria-hidden="true" />}
            onClick={() => setShareOpen(true)}
          >
            Share tracking
          </Button>
          <Button
            data-testid="shipment-remote-approval"
            disabled={!openApproval || actions.pending !== null}
            onClick={() => setApprovalOpen(true)}
            type="primary"
          >
            {openApproval ? "Remote approval" : approval ? approvalStateMeta[approval.state].label : "No approval"}
          </Button>
        </div>
      </div>

      {actions.error && !shareOpen && !approvalOpen ? (
        <p className="tms-approval__error" role="alert">
          {actions.error}
        </p>
      ) : null}

      <div className="tms-detail">
        <div className="tms-stack">
          <FlowPanel>
            <div className="tms-hero">
              <div className="tms-hero__head">
                <div>
                  <h2 className="tms-hero__id" data-testid="shipment-detail-id">
                    {shipment.id}
                  </h2>
                  <p className="tms-hero__sub">
                    {shipment.customer} · PO {shipment.po} · {shipment.contactName}
                  </p>
                </div>
                <StatusTag label={shipmentStatusMeta[shipment.status].label} tone={shipmentStatusMeta[shipment.status].tone} />
              </div>

              <div className="tms-hero__progress">
                <div className="tms-hero__progress-bar" role="img" aria-label={`${progressPercent}% of the route complete`}>
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="tms-hero__progress-labels">
                  <span>{shipment.origin}</span>
                  <span>{progressPercent}% complete</span>
                  <span>{shipment.destination}</span>
                </div>
              </div>

              <dl className="tms-hero__metrics">
                <div className="tms-hero__metric">
                  <dt>ETA</dt>
                  <dd data-testid="shipment-detail-eta">{formatTime(shipment.currentEta)}</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Window</dt>
                  <dd>{formatWindow(shipment.delivery)}</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Pallets</dt>
                  <dd>{shipment.pallets} / 26</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Weight</dt>
                  <dd>{shipment.weightLb.toLocaleString("en-US")} lb</dd>
                </div>
              </dl>
            </div>
          </FlowPanel>

          <FlowPanel title="Load plan">
            <dl className="tms-detail-list">
              <div>
                <dt>Equipment</dt>
                <dd>{shipment.equipment}</dd>
              </div>
              <div>
                <dt>Driver</dt>
                <dd>{driver?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt>Vehicle</dt>
                <dd>{vehicle ? `${vehicle.id} · ${vehicle.truck}` : "Unassigned"}</dd>
              </div>
              <div>
                <dt>BOL (demo)</dt>
                <dd>BOL-{shipment.po.split("-")[0] ?? "77341"}</dd>
              </div>
              <div>
                <dt>Pickup</dt>
                <dd>
                  {formatWindow(shipment.pickup)} · {shipment.origin}
                </dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {formatWindow(shipment.delivery)} · {shipment.destination}
                </dd>
              </div>
            </dl>
            {shipment.notes ? <p className="tms-muted">{shipment.notes}</p> : null}
          </FlowPanel>

          {route ? (
            <FlowPanel
              action={
                <span className="tms-muted">
                  {route.mode === "optimized" ? "Optimized order" : "Current order"} · {formatMiles(route.current.miles)}
                </span>
              }
              subtitle={`${route.name} · ${route.stops.length} stops`}
              title="Route and stops"
            >
              <ol className="tms-stop-list">
                {route.stops.slice(0, 6).map((stop, index) => (
                  <li className="tms-stop" key={stop.id}>
                    <span className="tms-stop__index">{index + 1}</span>
                    <span>
                      {stop.name}
                      <span className="tms-stop__meta">
                        {stop.city} · {formatWindow(stop.window)}
                      </span>
                    </span>
                    <span className="tms-stop__eta">{stop.completed ? "Completed" : "ETA pending"}</span>
                  </li>
                ))}
              </ol>
              {route.stops.length > 6 ? (
                <p className="tms-muted">+ {route.stops.length - 6} more stops in the route plan.</p>
              ) : null}
            </FlowPanel>
          ) : null}
        </div>

        <div className="tms-stack">
          <FlowPanel title="Route Agent">
            {approval ? (
              <div className="tms-agent-card">
                <span className="tms-agent-card__kicker">
                  <MapPin size={14} aria-hidden="true" /> {approvalStateMeta[approval.state].label}
                </span>
                <h3 className="tms-agent-card__title">
                  {approval.proposedRoute} · {formatTime(approval.proposedEta)}
                </h3>
                <p className="tms-agent-card__body">
                  {approval.reason} Saves {approval.savedMinutes} min for +{formatMiles(approval.proposedMiles - approval.currentMiles)}.
                </p>
                {openApproval ? (
                  <div className="tms-agent-card__actions">
                    <Button onClick={() => setApprovalOpen(true)} type="primary">
                      Approve route
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="tms-muted">No route change has been proposed for this shipment.</p>
            )}
          </FlowPanel>

          <FlowPanel title="Shipment audit" subtitle="Approval decisions update every screen">
            <AuditTrail emptyLabel="No decisions yet for this shipment." events={audits} />
          </FlowPanel>
        </div>
      </div>

      {shareOpen ? (
        <ShareTrackingModal
          error={actions.error}
          existingLink={existingLink}
          onClose={() => {
            setShareOpen(false);
            actions.clearError();
          }}
          onSubmit={handleShare}
          open
          pending={actions.pending === "create-tracking-link" || actions.pending === "update-tracking-link"}
          shipment={shipment}
        />
      ) : null}

      {approvalOpen && approval ? (
        <ApproveRouteModal
          approval={approval}
          driver={driver}
          error={actions.error}
          onApprove={(reason) => handleDecision("approve", reason)}
          onClose={() => {
            setApprovalOpen(false);
            actions.clearError();
          }}
          onReject={(reason) => handleDecision("reject", reason)}
          open
          pending={actions.pending === "route-approve" || actions.pending === "route-reject"}
          shipment={shipment}
        />
      ) : null}
    </div>
  );
}
