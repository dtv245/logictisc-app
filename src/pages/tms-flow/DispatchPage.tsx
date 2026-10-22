import { Button, Input } from "antd";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApproveRouteModal } from "@/components/tms-flow/ApproveRouteModal";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { ShipmentCard } from "@/components/tms-flow/ShipmentCard";
import { StatusTag } from "@/components/StatusTag";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import { useTmsFlow } from "@/hooks/tms-flow/useTmsFlow";
import { useTmsFlowActions } from "@/hooks/tms-flow/useTmsFlowActions";
import type { DispatchFilter } from "@/types/tms-flow/tmsFlow.types";
import { formatMiles, formatTime } from "@/utils/tms-flow/format";
import {
  selectDispatchFilterCounts,
  selectDispatchQueue,
  toNetworkRoutes,
  toNetworkVehicles,
} from "@/utils/tms-flow/selectors";
import { approvalStateMeta, isApprovalOpen } from "@/utils/tms-flow/presentation";

const FILTERS: Array<{ value: DispatchFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "at-risk", label: "At risk" },
  { value: "priority", label: "Priority" },
  { value: "approvals", label: "Approvals" },
];

const parseFilter = (value: string | null): DispatchFilter =>
  value === "at-risk" || value === "priority" || value === "approvals" ? value : "all";

export function DispatchPage() {
  const { state } = useTmsFlow();
  const actions = useTmsFlowActions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseFilter(searchParams.get("filter"));
  const shipmentParam = searchParams.get("shipment");
  const qParam = searchParams.get("q") ?? "";
  const query = qParam;
  const [approvalOpen, setApprovalOpen] = useState(false);

  if (state.status !== "ready") return null;
  const { snapshot } = state;
  const counts = selectDispatchFilterCounts(snapshot);
  const queue = selectDispatchQueue(snapshot, filter, query);
  const selected = queue.find((shipment) => shipment.id === shipmentParam) ?? queue[0];
  const approval = selected ? snapshot.approvals.find((item) => item.shipmentId === selected.id) : undefined;
  const route = selected?.routeId ? snapshot.routes.find((item) => item.id === selected.routeId) : undefined;
  const driver = selected?.driverId ? snapshot.drivers.find((item) => item.id === selected.driverId) : undefined;
  const selectedAgentApproval = approval && isApprovalOpen(approval.state) ? approval : undefined;

  const selectShipment = (shipmentId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("shipment", shipmentId);
    setSearchParams(next, { replace: true });
  };

  const setFilter = (value: DispatchFilter) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("filter");
    else next.set("filter", value);
    setSearchParams(next, { replace: true });
  };

  const setQuery = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const handleDecision = async (decision: "approve" | "reject", reason?: string) => {
    if (!approval) return;
    try {
      await actions.decideRoute(approval.id, decision, reason);
      setApprovalOpen(false);
    } catch {
      // actions.error carries the message back to the dialog.
    }
  };

  return (
    <div className="tms-page">
      <div className="tms-page__lead">
        <div>
          <h2 className="tms-page__title">Dispatch</h2>
          <p className="tms-page__subtitle">
            {queue.length} shipments in view · {counts.approvals} route approvals pending
          </p>
        </div>
      </div>

      {actions.error && !approvalOpen ? (
        <p className="tms-approval__error" role="alert">
          {actions.error}
        </p>
      ) : null}

      <div className="tms-dispatch">
        <FlowPanel testId="dispatch-queue" title="Queue">
          <div className="tms-filters" role="group" aria-label="Queue filter">
            {FILTERS.map((item) => (
              <button
                aria-pressed={filter === item.value}
                className={filter === item.value ? "is-active" : ""}
                data-testid={`dispatch-filter-${item.value}`}
                key={item.value}
                onClick={() => setFilter(item.value)}
                type="button"
              >
                {item.label} {counts[item.value === "at-risk" ? "atRisk" : item.value === "approvals" ? "approvals" : item.value === "priority" ? "priority" : "all"]}
              </button>
            ))}
          </div>
          <Input
            allowClear
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ID, customer, lane, PO"
            prefix={<Search size={14} aria-hidden="true" />}
            value={query}
          />
          <div className="tms-queue">
            {queue.map((shipment) => (
              <ShipmentCard
                compact
                driverName={snapshot.drivers.find((item) => item.id === shipment.driverId)?.name}
                key={shipment.id}
                onSelect={() => selectShipment(shipment.id)}
                selected={selected?.id === shipment.id}
                shipment={shipment}
              />
            ))}
            {queue.length === 0 ? <p className="tms-empty">No shipments match this filter.</p> : null}
          </div>
        </FlowPanel>

        <div className="tms-stack">
          <TmsFlowMap
            routes={toNetworkRoutes(snapshot.mapRoutes)}
            subtitle={selected ? `Selected ${selected.id} · ${selected.origin} → ${selected.destination}` : undefined}
            testId="dispatch-map"
            title="Corridor view"
            vehicles={toNetworkVehicles(snapshot.mapVehicles)}
          />

          {route ? (
            <FlowPanel title={`Route ${route.id}`} subtitle={`${route.name} · ${route.stops.length} stops`}>
              <div className="tms-route-compare">
                <div className="tms-route-compare__side">
                  <span>Current</span>
                  <strong>{formatMiles(route.current.miles)}</strong>
                  <p className="tms-muted">
                    {route.current.windowsMet} of {route.current.windowsTotal} windows met
                  </p>
                </div>
                <div className="tms-route-compare__side tms-route-compare__side--proposed">
                  <span>Optimized</span>
                  <strong>{formatMiles(route.optimized.miles)}</strong>
                  <p className="tms-muted">
                    {route.optimized.windowsMet} of {route.optimized.windowsTotal} windows met
                  </p>
                </div>
              </div>
            </FlowPanel>
          ) : null}
        </div>

        <div className="tms-stack tms-dispatch__agent">
          <FlowPanel title="Dispatch Agent">
            {selected ? (
              <>
                <div className="tms-agent-card">
                  <span className="tms-agent-card__kicker">
                    <Sparkles size={14} aria-hidden="true" /> Route Agent
                  </span>
                  <h3 className="tms-agent-card__title">
                    {selectedAgentApproval
                      ? `${selectedAgentApproval.proposedRoute} saves ${selectedAgentApproval.savedMinutes} min`
                      : approval
                        ? `Proposal ${approvalStateMeta[approval.state].label.toLowerCase()}`
                        : "No route change proposed"}
                  </h3>
                  <p className="tms-agent-card__body">
                    {selectedAgentApproval
                      ? `Current ETA ${formatTime(selectedAgentApproval.currentEta)} misses the window. Proposed ${formatTime(selectedAgentApproval.proposedEta)} adds ${formatMiles(selectedAgentApproval.proposedMiles - selectedAgentApproval.currentMiles)} and keeps HOS compliant.`
                      : approval
                        ? `The ${approval.proposedRoute} proposal is ${approvalStateMeta[approval.state].label.toLowerCase()}. Audit trail has the decision.`
                        : `${selected.id} is running to plan. Driver ${driver?.name ?? "unassigned"} and the receiver window are unchanged.`}
                  </p>
                  <div className="tms-agent-card__actions">
                    {selectedAgentApproval ? (
                      <Button
                        data-testid="dispatch-approve-route"
                        disabled={!selectedAgentApproval || actions.pending !== null}
                        onClick={() => setApprovalOpen(true)}
                        type="primary"
                      >
                        Approve route
                      </Button>
                    ) : null}
                    <Button onClick={() => navigate(`/tms/shipments/${selected.id}`)}>Review shipment</Button>
                  </div>
                </div>

                <div className="tms-detail-list" style={{ marginTop: 12 }}>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusTag
                        label={approval ? approvalStateMeta[approval.state].label : selected.status.replace("_", " ")}
                        tone={approval ? approvalStateMeta[approval.state].tone : "neutral"}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Driver</dt>
                    <dd>{driver?.name ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt>Customer</dt>
                    <dd>{selected.customer}</dd>
                  </div>
                  <div>
                    <dt>ETA</dt>
                    <dd>{formatTime(selected.currentEta)}</dd>
                  </div>
                  <div>
                    <dt>PO</dt>
                    <dd>{selected.po}</dd>
                  </div>
                  <div>
                    <dt>Equipment</dt>
                    <dd>{selected.equipment}</dd>
                  </div>
                </div>
              </>
            ) : (
              <p className="tms-empty">Select a shipment from the queue.</p>
            )}
          </FlowPanel>
        </div>
      </div>

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
          shipment={selected}
        />
      ) : null}
    </div>
  );
}
