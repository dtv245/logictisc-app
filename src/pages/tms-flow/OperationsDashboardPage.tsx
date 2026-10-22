import { Alert, Button, Spin } from "antd";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApproveSuggestionModal } from "@/components/tms-flow/ApproveSuggestionModal";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { KpiTile } from "@/components/tms-flow/KpiTile";
import { ShipmentCard } from "@/components/tms-flow/ShipmentCard";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import { TmsTimeline } from "@/components/tms-flow/TmsTimeline";
import { routes } from "@/constants/routes";
import { useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import type { TmsApproval } from "@/types/tms-flow/tmsFlow.types";
import { toNetworkVehicles, toShipmentMarkers, toTruckMarkers } from "@/utils/tms-flow/map";
import {
  describeTmsError,
  formatTmsDateTime,
  formatTmsDistance,
} from "@/utils/tms-flow/presentation";
import {
  selectPrimaryRiskShipment,
  summarizeTmsLoads,
} from "@/utils/tms-flow/status";

export function OperationsDashboardPage() {
  const navigate = useNavigate();
  const {
    loads,
    trucks,
    approvalIds,
    approvals,
    collection,
    generatedAt,
    shipments,
    isLoading,
    error,
  } = useTmsWorkspace();
  const [selectedApproval, setSelectedApproval] = useState<TmsApproval | null>(null);

  const primary = selectPrimaryRiskShipment(shipments);
  const summary = summarizeTmsLoads(shipments);
  const timeline = useTmsTimeline(primary?.id);
  const truckItems = trucks.data?.items ?? [];
  const locatedTrucks = truckItems
    .filter(
      (truck) =>
        truck.currentLocationLatitude != null &&
        truck.currentLocationLongitude != null,
    )
    .slice(0, 120);
  const markers = [
    ...toShipmentMarkers(primary),
    ...toTruckMarkers(locatedTrucks),
  ];
  const atRiskLoadIds = approvalIds;

  if (isLoading) {
    return (
      <div className="tms-page tms-flow--centered" aria-busy="true">
        <Spin size="large" />
        <p className="tms-muted">Loading operations data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tms-page">
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => void loads.refetch()}
            >
              Retry
            </Button>
          }
          message="Operations data could not load"
          description={describeTmsError(error)}
          showIcon
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="tms-page">
      <div className="tms-page__lead">
        <div>
          <h2 className="tms-page__title">Operations dashboard</h2>
          <p className="tms-page__subtitle">
            Live loads and AI dispatch decisions
            {generatedAt
              ? ` · refreshed ${formatTmsDateTime(new Date(generatedAt).toISOString())}`
              : ""}
          </p>
        </div>
        <div className="tms-row">
          <Button onClick={() => navigate(routes.tmsFlow.dispatch)}>Open dispatch</Button>
          <Button
            icon={<Sparkles size={15} aria-hidden="true" />}
            onClick={() => navigate(routes.tmsFlow.approvals)}
          >
            AI approvals ({approvals.length})
          </Button>
        </div>
      </div>

      {collection?.truncated ? (
        <Alert
          message={`Showing the first ${collection.items.length.toLocaleString("en-US")} of ${collection.totalItems.toLocaleString("en-US")} loads`}
          description="Summary counts cover the loaded rows only. A backend operations summary is still pending."
          showIcon
          type="warning"
        />
      ) : null}

      <div className="tms-kpi-grid">
        <KpiTile
          label="Active"
          onClick={() => navigate(routes.tmsFlow.dispatch)}
          testId="dashboard-kpi-active"
          value={summary.active.toLocaleString("en-US")}
        />
        <KpiTile
          label="In transit"
          testId="dashboard-kpi-in-transit"
          value={summary.inTransit.toLocaleString("en-US")}
        />
        <KpiTile
          label="Delivered today"
          testId="dashboard-kpi-delivered"
          tone="positive"
          value={summary.deliveredToday.toLocaleString("en-US")}
        />
        <KpiTile
          label="Delayed"
          onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=at-risk`)}
          testId="dashboard-kpi-delayed"
          tone="danger"
          value={summary.delayed.toLocaleString("en-US")}
        />
        <KpiTile
          label="At risk"
          onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=at-risk`)}
          testId="dashboard-kpi-at-risk"
          tone="warning"
          value={summary.atRisk.toLocaleString("en-US")}
        />
        <KpiTile
          label="Unassigned"
          onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=unassigned`)}
          testId="dashboard-kpi-unassigned"
          value={summary.unassigned.toLocaleString("en-US")}
        />
      </div>

      <div className="tms-dashboard-grid">
        <div className="tms-stack">
          <FlowPanel
            action={
              primary ? (
                <Button
                  icon={<ArrowRight size={14} aria-hidden="true" />}
                  onClick={() => navigate(`/tms/shipments/${primary.id}`)}
                  type="primary"
                >
                  Open load
                </Button>
              ) : null
            }
            subtitle={
              primary
                ? `${formatTmsDateTime(primary.requestedDeliveryDate)} · ${primary.customerName}`
                : undefined
            }
            title="Shipment at risk"
          >
            {primary ? (
              <div className="tms-at-risk">
                <div className="tms-at-risk__times">
                  <div className="tms-at-risk__time">
                    <span>Requested delivery</span>
                    <strong>{formatTmsDateTime(primary.requestedDeliveryDate)}</strong>
                  </div>
                  <div className="tms-at-risk__time">
                    <span>Operational status</span>
                    <strong>{primary.status.replace("_", " ")}</strong>
                  </div>
                  <div className="tms-at-risk__time">
                    <span>Truck</span>
                    <strong>{primary.assignedTruckNumber ?? "Unassigned"}</strong>
                  </div>
                </div>
                <ShipmentCard
                  onSelect={() => navigate(`/tms/shipments/${primary.id}`)}
                  shipment={primary}
                />
                <div className="tms-at-risk__actions">
                  <Button onClick={() => navigate(`${routes.tmsFlow.dispatch}?shipment=${primary.id}`)}>
                    Open in dispatch
                  </Button>
                  {atRiskLoadIds.has(primary.id) ? (
                    <Button
                      onClick={() => navigate(`${routes.tmsFlow.approvals}?load=${primary.id}`)}
                      type="primary"
                    >
                      Review AI decision
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="tms-empty">No active load is delayed or inside the risk window.</p>
            )}
          </FlowPanel>

          <TmsFlowMap
            markers={markers}
            subtitle={`${locatedTrucks.length} trucks reporting a position`}
            testId="dashboard-map"
            title="Network"
            vehicles={toNetworkVehicles(locatedTrucks)}
          />
        </div>

        <div className="tms-stack">
          <FlowPanel
            action={
              approvals.length > 0 ? (
                <Button onClick={() => navigate(routes.tmsFlow.approvals)} size="small">
                  View all
                </Button>
              ) : null
            }
            subtitle="Pending AI dispatch decisions"
            title="Needs attention"
          >
            {approvals.length === 0 ? (
              <p className="tms-empty">No AI dispatch decision is waiting for approval.</p>
            ) : (
              <ul className="tms-brief__list">
                {approvals.slice(0, 5).map((approval) => (
                  <li key={approval.suggestion.decisionId}>
                    <button
                      className="tms-brief__action"
                      onClick={() => setSelectedApproval(approval)}
                      type="button"
                    >
                      <span>
                        <strong>
                          {approval.load
                            ? `#${approval.load.number} · ${approval.load.originCity} → ${approval.load.destinationCity}`
                            : `Decision ${approval.suggestion.decisionId.slice(0, 8)}`}
                        </strong>
                        <small className="tms-muted">
                          {approval.suggestion.truckNumber ?? approval.suggestion.truckId}
                          {approval.suggestion.driverName
                            ? ` · ${approval.suggestion.driverName}`
                            : ""}
                          {approval.load
                            ? ` · ${formatTmsDistance(approval.load.distance)}`
                            : ""}
                        </small>
                      </span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </FlowPanel>

          <FlowPanel title="Operations brief">
            <ul className="tms-brief__list">
              <li>{summary.delayed} loads are past their requested delivery time.</li>
              <li>{summary.atRisk} loads are due within the next 4 hours.</li>
              <li>{summary.unassigned} active loads have no truck assigned.</li>
              <li>{approvals.length} AI dispatch decisions are pending approval.</li>
            </ul>
            <div className="tms-brief__actions">
              <button
                className="tms-brief__action"
                onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=at-risk`)}
                type="button"
              >
                <span><Sparkles size={14} aria-hidden="true" /> Review at-risk queue</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button
                className="tms-brief__action"
                onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=unassigned`)}
                type="button"
              >
                <span>Assign unassigned loads</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button
                className="tms-brief__action"
                onClick={() => navigate(routes.tmsFlow.approvals)}
                type="button"
              >
                <span>Open AI approvals</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </FlowPanel>

          <FlowPanel
            subtitle={primary ? `Load #${primary.number}` : undefined}
            title="Latest execution events"
          >
            <TmsTimeline
              emptyLabel="No timeline events for the at-risk load."
              events={timeline.data?.events ?? []}
              limit={5}
            />
          </FlowPanel>
        </div>
      </div>

      {selectedApproval ? (
        <ApproveSuggestionModal
          approval={selectedApproval}
          key={selectedApproval.suggestion.decisionId}
          onClose={() => setSelectedApproval(null)}
          open
        />
      ) : null}
    </div>
  );
}
