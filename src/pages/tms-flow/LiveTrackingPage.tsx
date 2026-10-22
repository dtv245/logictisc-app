import { Button, Spin } from "antd";
import { ArrowLeft, Map, RefreshCw, Rows3 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { NetworkRouteMap } from "@/components/dashboard/NetworkRouteMap";
import { useLiveTracking } from "@/hooks/tms-flow/useLiveTracking";
import { formatDuration, formatMiles, formatTime } from "@/utils/tms-flow/format";
import { toNetworkRoutes, toNetworkVehicles } from "@/utils/tms-flow/selectors";
import "@/styles/tms-flow.scss";

type VehicleFilter = "all" | "moving" | "alerts";

export function LiveTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const live = useLiveTracking(token);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState<VehicleFilter>("all");

  if (live.status === "loading") {
    return (
      <div className="tms-live" aria-busy="true">
        <div className="tms-live__error">
          <Spin size="large" />
          <p>Loading live tracking…</p>
        </div>
      </div>
    );
  }

  if (live.status === "error" || !live.view) {
    return (
      <div className="tms-live">
        <div className="tms-live__error" role="alert">
          <h1>Tracking link unavailable</h1>
          <p>{live.error ?? "This tracking link is invalid or has expired."}</p>
          <Link to="/tms">Back to the demo dashboard</Link>
        </div>
      </div>
    );
  }

  const { view, snapshot } = live;
  const { shipment, preferences } = view;
  const driver = view.driver;
  const vehicle = view.vehicle;
  const route = snapshot?.mapRoutes.find((item) => item.id === shipment.routeId) ?? snapshot?.mapRoutes[0];
  const mapVehicles = snapshot ? toNetworkVehicles(snapshot.mapVehicles) : [];
  const mapRoutes = snapshot ? toNetworkRoutes(route ? [route] : []) : [];
  const approval = snapshot?.approvals.find((item) => item.shipmentId === shipment.id);

  const listVehicles = mapVehicles.filter((item) => {
    if (filter === "moving") return item.status === "moving";
    if (filter === "alerts") return item.status === "delayed";
    return true;
  });

  return (
    <div className="tms-live">
      <header className="tms-live__header">
        <div>
          <h1>{shipment.id} · live tracking</h1>
          <p>
            {shipment.origin} → {shipment.destination} · {shipment.customer} · demo token, no backend call
          </p>
        </div>
        <Button icon={<ArrowLeft size={14} aria-hidden="true" />} href="/tms">
          Back to operations
        </Button>
      </header>

      <div className={`tms-live__freshness${live.stale ? " is-stale" : ""}`} role="status">
        {live.stale
          ? `Data may be stale · last update ${live.updatedSecondsAgo}s ago`
          : `Updated ${live.updatedSecondsAgo}s ago`}
        <Button
          icon={<RefreshCw size={13} aria-hidden="true" />}
          onClick={live.reload}
          size="small"
          type="text"
        >
          Refresh
        </Button>
        {live.stale ? <span>· the demo never fakes a fresh signal</span> : null}
      </div>

      <div className="tms-live__grid">
        <section className="tms-live__panel" aria-label="Live vehicle map">
          <div className="tms-row" style={{ marginBottom: 10 }}>
            <div className="tms-filters" style={{ marginBottom: 0 }}>
              {(["all", "moving", "alerts"] as VehicleFilter[]).map((value) => (
                <button
                  aria-pressed={filter === value}
                  className={filter === value ? "is-active" : ""}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {value === "all" ? "All" : value === "moving" ? "Moving" : "Alerts"}
                </button>
              ))}
            </div>
            <div className="tms-row" style={{ gap: 6 }}>
              <Button
                aria-pressed={viewMode === "map"}
                data-testid="live-view-map"
                icon={<Map size={14} aria-hidden="true" />}
                onClick={() => setViewMode("map")}
                size="small"
                type={viewMode === "map" ? "primary" : "default"}
              >
                Map
              </Button>
              <Button
                aria-pressed={viewMode === "list"}
                data-testid="live-view-list"
                icon={<Rows3 size={14} aria-hidden="true" />}
                onClick={() => setViewMode("list")}
                size="small"
                type={viewMode === "list" ? "primary" : "default"}
              >
                List
              </Button>
            </div>
          </div>

          {viewMode === "map" ? (
            preferences.liveMap ? (
              <div className="tms-map__canvas">
                <NetworkRouteMap routes={mapRoutes} vehicles={mapVehicles} />
              </div>
            ) : (
              <p className="tms-empty" role="status">
                Live map is hidden by the operator for this tracking link.
              </p>
            )
          ) : (
            <ul className="tms-map__vehicle-list" aria-label="Vehicles">
              {listVehicles.map((item) => (
                <li key={item.id} data-testid={`live-list-vehicle-${item.id}`}>
                  <strong>{item.plate}</strong>
                  <span>{item.loadReference ?? "Unassigned"}</span>
                  <span className={`tms-map__status tms-map__status--${item.status}`}>{item.status}</span>
                </li>
              ))}
              {listVehicles.length === 0 ? <li className="tms-empty">No vehicles in this filter.</li> : null}
            </ul>
          )}

          <div className="tms-map__legend">
            <span><i className="tms-map__dot tms-map__dot--moving" aria-hidden="true" /> Moving</span>
            <span><i className="tms-map__dot tms-map__dot--delayed" aria-hidden="true" /> Delayed</span>
            <span><i className="tms-map__line" aria-hidden="true" /> Route</span>
          </div>

          <p className="tms-muted" style={{ marginTop: 12 }}>
            {formatMiles(view.progressMiles)} of {formatMiles(view.totalMiles)} complete · {shipment.status.replace("_", " ")}
          </p>
        </section>

        <div className="tms-stack">
          <section className="tms-live__panel" data-testid={`live-vehicle-${vehicle?.id ?? shipment.id}`}>
            <div className="tms-row">
              <div>
                <h2 className="tms-panel__title">On the road</h2>
                <p className="tms-panel__subtitle">
                  {vehicle ? `${vehicle.id} · ${vehicle.truck}` : "Vehicle telemetry unavailable"}
                </p>
              </div>
              {preferences.eta ? (
                <div>
                  <span className="tms-kpi__label">ETA</span>
                  <strong className="tms-kpi__value" data-testid={`live-eta-${shipment.id}`}>
                    {formatTime(view.eta)}
                  </strong>
                </div>
              ) : null}
            </div>

            <dl className="tms-live__stats" style={{ marginTop: 12 }}>
              {driver ? (
                <div>
                  <dt>Driver</dt>
                  <dd>{driver.name}</dd>
                </div>
              ) : (
                <div>
                  <dt>Driver</dt>
                  <dd>Hidden</dd>
                </div>
              )}
              <div>
                <dt>Speed</dt>
                <dd>
                  {view.speedMph ?? "—"} mph
                  {view.speedChangePercent !== undefined ? ` (${view.speedChangePercent}%)` : ""}
                </dd>
              </div>
              {view.reeferTempF !== undefined ? (
                <div>
                  <dt>Reefer</dt>
                  <dd>
                    {view.reeferTempF}°F / set {view.reeferSetF}°F
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Fuel</dt>
                <dd>{view.fuelPercent ?? "—"}% · {view.rangeMiles ?? "—"} mi range</dd>
              </div>
              <div>
                <dt>HOS left</dt>
                <dd>{view.hosRemainingMinutes !== undefined ? formatDuration(view.hosRemainingMinutes) : "—"}</dd>
              </div>
            </dl>

            <p className="tms-share__privacy" style={{ marginTop: 12 }}>
              {driver ? "Driver contact visibility follows the operator's sharing preferences." : "Driver name and phone are off for this link."}
            </p>
          </section>

          <section className="tms-live__panel">
            <div className="tms-agent-card">
              <span className="tms-agent-card__kicker">Route Agent</span>
              <h3 className="tms-agent-card__title">
                {approval
                  ? approval.state === "applied"
                    ? `${approval.proposedRoute} approved · now ${formatTime(approval.proposedEta)}`
                    : `${approval.proposedRoute} proposal ${approval.state.replace("_", " ")}`
                  : "Running to plan"}
              </h3>
              <p className="tms-agent-card__body">
                {approval
                  ? approval.reason
                  : "No route change is pending. ETA updates when the next telemetry ping arrives."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
