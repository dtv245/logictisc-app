import { Alert, Button, Spin } from "antd";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Truck as TruckIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ApproveSuggestionModal } from "@/components/tms-flow/ApproveSuggestionModal";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { StatusTag } from "@/components/StatusTag";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import { TmsTimeline } from "@/components/tms-flow/TmsTimeline";
import { routes } from "@/constants/routes";
import { useTmsLoad, useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { findApprovalForLoad } from "@/utils/tms-flow/approvals";
import {
  toNetworkVehicles,
  toShipmentMarkers,
  toTruckMarker,
} from "@/utils/tms-flow/map";
import {
  describeTmsError,
  formatTmsDateTime,
  formatTmsDistance,
  formatTmsMoney,
  operationalStatusMeta,
  riskMeta,
} from "@/utils/tms-flow/presentation";

export function ShipmentDetailPage() {
  const navigate = useNavigate();
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const loadQuery = useTmsLoad(shipmentId);
  const workspace = useTmsWorkspace();
  const timeline = useTmsTimeline(shipmentId);
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = loadQuery.data;
  const truckItems = workspace.trucks.data?.items ?? [];
  const assignedTruck = truckItems.find(
    (truck) => truck.id === load?.assignedTruckId,
  );
  const approval = findApprovalForLoad(workspace.approvals, load?.id);
  const assignedMarker = toTruckMarker(assignedTruck);
  const markers = [
    ...toShipmentMarkers(load),
    ...(assignedMarker ? [assignedMarker] : []),
  ];

  if (loadQuery.isLoading) {
    return (
      <div className="tms-page tms-flow--centered" aria-busy="true">
        <Spin size="large" />
        <p className="tms-muted">Loading load…</p>
      </div>
    );
  }

  if (loadQuery.error) {
    return (
      <div className="tms-page">
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => void loadQuery.refetch()}
            >
              Retry
            </Button>
          }
          description={describeTmsError(loadQuery.error)}
          message="Load could not load"
          showIcon
          type="error"
        />
        <div className="tms-row">
          <Button
            icon={<ArrowLeft size={14} aria-hidden="true" />}
            onClick={() => navigate(routes.tmsFlow.dispatch)}
          >
            Back to dispatch
          </Button>
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="tms-page">
        <FlowPanel title="Load not found">
          <p className="tms-muted">
            No load matches “{shipmentId}”. It may belong to another tenant or
            have been removed.
          </p>
          <Button
            icon={<ArrowLeft size={14} aria-hidden="true" />}
            onClick={() => navigate(routes.tmsFlow.dispatch)}
          >
            Back to dispatch
          </Button>
        </FlowPanel>
      </div>
    );
  }

  const status = operationalStatusMeta[load.status];
  const risk = riskMeta[load.risk];

  return (
    <div className="tms-page">
      <div className="tms-row">
        <Button
          icon={<ArrowLeft size={14} aria-hidden="true" />}
          onClick={() => navigate(routes.tmsFlow.dispatch)}
          type="text"
        >
          Dispatch
        </Button>
        <div className="tms-hero__actions">
          {assignedTruck ? (
            <Button
              icon={<TruckIcon size={14} aria-hidden="true" />}
              onClick={() => navigate(`/trucks/show/${assignedTruck.id}`)}
            >
              View truck
            </Button>
          ) : null}
          <Button
            icon={<ExternalLink size={14} aria-hidden="true" />}
            onClick={() =>
              navigate(routes.resources.loads.show.replace(":id", load.id))
            }
          >
            Open in Loads
          </Button>
          {approval ? (
            <Button
              icon={<Sparkles size={14} aria-hidden="true" />}
              onClick={() => setReviewOpen(true)}
              type="primary"
            >
              Review AI decision
            </Button>
          ) : null}
        </div>
      </div>

      <div className="tms-detail">
        <div className="tms-stack">
          <FlowPanel>
            <div className="tms-hero">
              <div className="tms-hero__head">
                <div>
                  <h2 className="tms-hero__id" data-testid="shipment-detail-id">
                    #{load.number}
                  </h2>
                  <p className="tms-hero__sub">
                    {load.name} · {load.customerName}
                  </p>
                </div>
                <div className="tms-row">
                  <StatusTag label={status.label} tone={status.tone} />
                  {load.risk !== "none" ? (
                    <StatusTag label={risk.label} tone={risk.tone} />
                  ) : null}
                  {load.isHazmat ? (
                    <StatusTag
                      label={load.hazmatClass ? `Hazmat ${load.hazmatClass}` : "Hazmat"}
                      tone="error"
                    />
                  ) : null}
                </div>
              </div>

              <div className="tms-hero__metrics">
                <div className="tms-hero__metric">
                  <dt>Requested pickup</dt>
                  <dd>{formatTmsDateTime(load.requestedPickupDate)}</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Requested delivery</dt>
                  <dd data-testid="shipment-detail-delivery">
                    {formatTmsDateTime(load.requestedDeliveryDate)}
                  </dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Distance</dt>
                  <dd>{formatTmsDistance(load.distance)}</dd>
                </div>
                <div className="tms-hero__metric">
                  <dt>Delivery cost</dt>
                  <dd>
                    {formatTmsMoney(
                      load.deliveryCostAmount,
                      load.deliveryCostCurrency,
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </FlowPanel>

          <FlowPanel title="Route and addresses">
            <dl className="tms-detail-list">
              <div>
                <dt>Pickup</dt>
                <dd>{load.originAddress || load.originCity}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{load.destinationAddress || load.destinationCity}</dd>
              </div>
              <div>
                <dt>Backend status</dt>
                <dd>{load.rawStatus}</dd>
              </div>
              <div>
                <dt>Operation</dt>
                <dd>{status.label}</dd>
              </div>
            </dl>
            {load.notes ? <p className="tms-muted">{load.notes}</p> : null}
          </FlowPanel>

          <TmsFlowMap
            markers={markers}
            subtitle={
              load.originCity !== "—"
                ? `${load.originCity} → ${load.destinationCity}`
                : undefined
            }
            testId="shipment-map"
            title="Load points"
            vehicles={toNetworkVehicles(assignedTruck ? [assignedTruck] : [])}
          />

          <FlowPanel title="Execution timeline">
            {timeline.error ? (
              <Alert
                action={
                  <Button
                    icon={<RefreshCw size={14} aria-hidden="true" />}
                    onClick={() => void timeline.refetch()}
                    size="small"
                  >
                    Retry
                  </Button>
                }
                description={describeTmsError(timeline.error)}
                message="Execution timeline could not load"
                showIcon
                type="warning"
              />
            ) : (
              <TmsTimeline
                emptyLabel="No execution events recorded for this load."
                events={timeline.data?.events ?? []}
              />
            )}
          </FlowPanel>
        </div>

        <div className="tms-stack">
          <FlowPanel
            action={
              assignedTruck ? (
                <Button
                  onClick={() => navigate(`/trucks/show/${assignedTruck.id}`)}
                  size="small"
                >
                  Truck
                </Button>
              ) : null
            }
            title="Assignment"
          >
            <dl className="tms-detail-list">
              <div>
                <dt>Truck</dt>
                <dd>{load.assignedTruckNumber ?? assignedTruck?.number ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt>Driver</dt>
                <dd>{assignedTruck?.mainDriverName ?? "Unassigned"}</dd>
              </div>
              {assignedTruck ? (
                <div>
                  <dt>Type</dt>
                  <dd>{assignedTruck.type.replace("_", " ")}</dd>
                </div>
              ) : null}
              {assignedTruck ? (
                <div>
                  <dt>Status</dt>
                  <dd>{assignedTruck.status.replace("_", " ")}</dd>
                </div>
              ) : null}
            </dl>
          </FlowPanel>

          <FlowPanel title="Milestones">
            {load.dispatchedAt ||
            load.pickedUpAt ||
            load.deliveredAt ||
            load.cancelledAt ? (
              <dl className="tms-detail-list">
                {load.dispatchedAt ? (
                  <div>
                    <dt>Dispatched</dt>
                    <dd>{formatTmsDateTime(load.dispatchedAt)}</dd>
                  </div>
                ) : null}
                {load.pickedUpAt ? (
                  <div>
                    <dt>Picked up</dt>
                    <dd>{formatTmsDateTime(load.pickedUpAt)}</dd>
                  </div>
                ) : null}
                {load.deliveredAt ? (
                  <div>
                    <dt>Delivered</dt>
                    <dd>{formatTmsDateTime(load.deliveredAt)}</dd>
                  </div>
                ) : null}
                {load.cancelledAt ? (
                  <div>
                    <dt>Cancelled</dt>
                    <dd>{formatTmsDateTime(load.cancelledAt)}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="tms-empty">No milestone recorded yet.</p>
            )}
          </FlowPanel>

          <FlowPanel
            subtitle={
              approval
                ? `Decision ${approval.suggestion.decisionId.slice(0, 8)}`
                : undefined
            }
            title="AI dispatch"
          >
            {approval ? (
              <div className="tms-stack">
                <div className="tms-row">
                  <StatusTag
                    label={approval.suggestion.confidence}
                    tone="neutral"
                  />
                  <span className="tms-muted">
                    Rank #{approval.suggestion.rank} · score{" "}
                    {Number(approval.suggestion.score).toFixed(1)}
                  </span>
                </div>
                <p className="tms-muted">{approval.suggestion.reasoning}</p>
                <Button onClick={() => setReviewOpen(true)} type="primary">
                  Review and decide
                </Button>
              </div>
            ) : (
              <p className="tms-empty">
                No AI dispatch decision is waiting for this load.
              </p>
            )}
          </FlowPanel>
        </div>
      </div>

      {approval && reviewOpen ? (
        <ApproveSuggestionModal
          approval={approval}
          key={approval.suggestion.decisionId}
          onClose={() => setReviewOpen(false)}
          open
        />
      ) : null}
    </div>
  );
}
