import { Button } from "antd";
import { ArrowRight, Map, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AuditTrail } from "@/components/tms-flow/AuditTrail";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { KpiTile } from "@/components/tms-flow/KpiTile";
import { ShipmentCard } from "@/components/tms-flow/ShipmentCard";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import { useTmsFlow } from "@/hooks/tms-flow/useTmsFlow";
import {
  selectDashboard,
  selectPrimaryAtRiskShipment,
  toNetworkRoutes,
  toNetworkVehicles,
} from "@/utils/tms-flow/selectors";
import { formatTime, formatWindow } from "@/utils/tms-flow/format";

export function OperationsDashboardPage() {
  const { state } = useTmsFlow();
  const navigate = useNavigate();

  if (state.status !== "ready") return null;
  const { snapshot } = state;
  const dashboard = selectDashboard(snapshot);
  const atRisk = selectPrimaryAtRiskShipment(snapshot);
  const driver = atRisk?.driverId ? snapshot.drivers.find((item) => item.id === atRisk.driverId) : undefined;
  const token =
    snapshot.trackingLinks.find((link) => link.shipmentId === atRisk?.id)?.token ?? "demo-SF-48291-live";

  const proposedDelta =
    atRisk?.proposedEta
      ? Math.round((new Date(atRisk.currentEta).getTime() - new Date(atRisk.proposedEta).getTime()) / 60_000)
      : undefined;

  const timeline = snapshot.shipments
    .filter((shipment) => shipment.driverId && shipment.status !== "delivered")
    .sort((left, right) => new Date(left.currentEta).getTime() - new Date(right.currentEta).getTime())
    .slice(0, 4)
    .map((shipment) => ({
      shipment,
      driverName: snapshot.drivers.find((item) => item.id === shipment.driverId)?.name ?? "Unassigned",
    }));

  return (
    <div className="tms-page">
      <div className="tms-page__lead">
        <div>
          <h2 className="tms-page__title">Operations dashboard</h2>
          <p className="tms-page__subtitle">Monday peak coverage · fixture snapshot, demo clock frozen at 3:20 PM</p>
        </div>
        <Button icon={<Map size={15} aria-hidden="true" />} onClick={() => navigate(`/tms/tracking/${token}`)}>
          Open live map
        </Button>
      </div>

      <div className="tms-kpi-grid">
        <KpiTile label="Active" onClick={() => navigate("/tms/dispatch")} testId="dashboard-kpi-active" value={dashboard.kpis.active.toLocaleString("en-US")} />
        <KpiTile label="In transit" onClick={() => navigate("/tms/dispatch")} testId="dashboard-kpi-in-transit" value={dashboard.kpis.inTransit.toLocaleString("en-US")} />
        <KpiTile label="Delivered today" onClick={() => navigate("/tms/dispatch")} testId="dashboard-kpi-delivered" tone="positive" value={dashboard.kpis.deliveredToday.toLocaleString("en-US")} />
        <KpiTile label="Delayed" onClick={() => navigate("/tms/dispatch?filter=at-risk")} testId="dashboard-kpi-delayed" tone="warning" value={dashboard.kpis.delayed} />
        <KpiTile label="At risk" onClick={() => navigate("/tms/dispatch?filter=at-risk")} testId="dashboard-kpi-at-risk" tone="danger" value={dashboard.kpis.atRisk} />
        <KpiTile label="Exceptions" onClick={() => navigate("/tms/dispatch?filter=priority")} testId="dashboard-kpi-exceptions" value={dashboard.kpis.exceptions} />
      </div>

      <div className="tms-dashboard-grid">
        <div className="tms-stack">
          <FlowPanel
            action={
              atRisk ? (
                <Button
                  icon={<ArrowRight size={14} aria-hidden="true" />}
                  onClick={() => navigate(`/tms/dispatch?shipment=${atRisk.id}`)}
                  type="primary"
                >
                  Review
                </Button>
              ) : null
            }
            subtitle={atRisk ? `Delivery window ${formatWindow(atRisk.delivery)} · ${atRisk.customer}` : undefined}
            title="Shipment at risk"
          >
            {atRisk ? (
              <div className="tms-at-risk">
                <div className="tms-at-risk__times">
                  <div className="tms-at-risk__time">
                    <span>Current ETA</span>
                    <strong>{formatTime(atRisk.currentEta)}</strong>
                  </div>
                  <div className="tms-at-risk__time tms-at-risk__time--proposed">
                    <span>Proposed ETA</span>
                    <strong>{atRisk.proposedEta ? formatTime(atRisk.proposedEta) : "—"}</strong>
                  </div>
                  <div className="tms-at-risk__time">
                    <span>Window closes</span>
                    <strong>{formatTime(atRisk.delivery.end)}</strong>
                  </div>
                </div>
                <p className="tms-muted">
                  {proposedDelta !== undefined
                    ? `The Route Agent proposes an I-680 reroute that saves ${proposedDelta} minutes and gets inside the receiver window.`
                    : "This shipment is inside its delivery window."}
                </p>
                <ShipmentCard
                  driverName={driver?.name}
                  onSelect={() => navigate(`/tms/shipments/${atRisk.id}`)}
                  shipment={atRisk}
                />
                <div className="tms-at-risk__actions">
                  <Button onClick={() => navigate(`/tms/dispatch?shipment=${atRisk.id}`)}>Open in dispatch</Button>
                  <Button onClick={() => navigate(`/tms/shipments/${atRisk.id}`)} type="primary">
                    Open shipment
                  </Button>
                </div>
              </div>
            ) : (
              <p className="tms-empty">No shipment is at risk right now.</p>
            )}
          </FlowPanel>

          <TmsFlowMap
            routes={toNetworkRoutes(snapshot.mapRoutes)}
            subtitle="Fixture telemetry · no backend call"
            testId="dashboard-map"
            title="Network"
            vehicles={toNetworkVehicles(snapshot.mapVehicles)}
          />
        </div>

        <div className="tms-stack">
          <FlowPanel title="Operations brief" subtitle="Three causes, three suggested actions">
            <ul className="tms-brief__list">
              <li>3 reefer loads are bunched on I-80; rerouting 5 drivers protects the 4 PM window.</li>
              <li>12 loads still need a driver; 11 can be auto-assigned, 1 needs a dock slot.</li>
              <li>4 customers have not received an ETA update since the last scan.</li>
            </ul>
            <div className="tms-brief__actions">
              <button className="tms-brief__action" onClick={() => navigate("/tms/dispatch?filter=approvals")} type="button">
                <span><Sparkles size={14} aria-hidden="true" /> Review 5 reroute options</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button className="tms-brief__action" onClick={() => navigate("/tms/dispatch?filter=priority")} type="button">
                <span>Reassign 3 priority loads</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
              <button className="tms-brief__action" onClick={() => navigate(`/tms/tracking/${token}`)} type="button">
                <span>Open live map for customer updates</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </FlowPanel>

          <FlowPanel
            action={
              <Button onClick={() => navigate("/tms/dispatch")} size="small">
                Open dispatch
              </Button>
            }
            title="Dispatch timeline"
          >
            <ul className="tms-timeline">
              {timeline.map(({ shipment, driverName }) => (
                <li className="tms-timeline__item" key={shipment.id}>
                  <time>{formatTime(shipment.currentEta)}</time>
                  <span>
                    {shipment.id} · {shipment.customer}
                    <small>{driverName}</small>
                  </span>
                  <span className={`tms-map__status tms-map__status--${shipment.status === "at_risk" ? "delayed" : "moving"}`}>
                    {shipment.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          </FlowPanel>

          <FlowPanel title="Audit trail" subtitle="Demo events only">
            <AuditTrail events={snapshot.audits} limit={5} />
          </FlowPanel>
        </div>
      </div>
    </div>
  );
}
