import { Alert, Button, Input, Spin } from "antd";
import {
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApproveSuggestionModal } from "@/components/tms-flow/ApproveSuggestionModal";
import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { ShipmentCard } from "@/components/tms-flow/ShipmentCard";
import { StatusTag } from "@/components/StatusTag";
import { TmsFlowMap } from "@/components/tms-flow/TmsFlowMap";
import { TmsTimeline } from "@/components/tms-flow/TmsTimeline";
import { routes } from "@/constants/routes";
import { useTmsTimeline } from "@/hooks/tms-flow/useTmsQueries";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import type {
  TmsApproval,
  TmsQueueCounts,
  TmsQueueFilter,
} from "@/types/tms-flow/tmsFlow.types";
import { toNetworkVehicles, toShipmentMarkers, toTruckMarkers } from "@/utils/tms-flow/map";
import {
  describeSuggestionMetrics,
  describeTmsError,
  formatTmsDateTime,
  formatTmsDistance,
  formatTmsMoney,
  operationalStatusMeta,
  riskMeta,
} from "@/utils/tms-flow/presentation";
import {
  selectTmsCounts,
  selectTmsQueue,
} from "@/utils/tms-flow/status";

const FILTERS: Array<{
  value: TmsQueueFilter;
  label: string;
  countKey: keyof TmsQueueCounts;
}> = [
  { value: "all", label: "All", countKey: "all" },
  { value: "at-risk", label: "At risk", countKey: "atRisk" },
  { value: "unassigned", label: "Unassigned", countKey: "unassigned" },
  { value: "approvals", label: "AI approvals", countKey: "approvals" },
];

const parseFilter = (value: string | null): TmsQueueFilter =>
  value === "at-risk" || value === "unassigned" || value === "approvals"
    ? value
    : "all";

const decisionMetrics = (approval: TmsApproval) =>
  describeSuggestionMetrics(approval.suggestion.metrics);

export interface DispatchPageProps {
  /** `/tms/approvals` renders the same workspace locked to pending decisions. */
  approvalsOnly?: boolean;
}

export function DispatchPage({ approvalsOnly = false }: DispatchPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspace = useTmsWorkspace();
  const [reviewed, setReviewed] = useState<TmsApproval | null>(null);

  const filter: TmsQueueFilter = approvalsOnly
    ? "approvals"
    : parseFilter(searchParams.get("filter"));
  const query = searchParams.get("q") ?? "";
  const shipmentParam = searchParams.get("shipment");
  const decisionParam = searchParams.get("decision");

  const { approvals, approvalIds, collection, shipments, trucks } = workspace;
  const counts = selectTmsCounts(shipments, approvals.length);
  const queue = selectTmsQueue(shipments, filter, query, approvalIds);
  const selected = queue.find((shipment) => shipment.id === shipmentParam) ?? queue[0];

  const selectedApproval =
    (decisionParam
      ? approvals.find((item) => item.suggestion.decisionId === decisionParam)
      : undefined) ?? approvals[0];
  const selectedDecision = approvalsOnly ? selectedApproval : undefined;
  const selectedLoad = approvalsOnly ? selectedDecision?.load : selected;
  const focusApprovals = selected
    ? approvals.filter((item) => item.load?.id === selected.id)
    : [];
  const selectedTruck = workspace.trucks.data?.items.find(
    (truck) => truck.id === selectedLoad?.assignedTruckId,
  );

  const timeline = useTmsTimeline(selectedLoad?.id);
  const truckItems = trucks.data?.items ?? [];
  const locatedTrucks = truckItems
    .filter(
      (truck) =>
        truck.currentLocationLatitude != null &&
        truck.currentLocationLongitude != null,
    )
    .slice(0, 120);
  const markers = [
    ...toShipmentMarkers(selectedLoad),
    ...toTruckMarkers(locatedTrucks),
  ];

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const setFilter = (value: TmsQueueFilter) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("filter");
    else next.set("filter", value);
    next.delete("shipment");
    setSearchParams(next, { replace: true });
  };

  if (workspace.isLoading) {
    return (
      <div className="tms-page tms-flow--centered" aria-busy="true">
        <Spin size="large" />
        <p className="tms-muted">Loading dispatch data…</p>
      </div>
    );
  }

  if (workspace.error) {
    return (
      <div className="tms-page">
        <Alert
          action={
            <Button
              icon={<RefreshCw size={14} aria-hidden="true" />}
              onClick={() => {
                void workspace.loads.refetch();
                void workspace.pending.refetch();
                void workspace.trucks.refetch();
              }}
            >
              Retry
            </Button>
          }
          description={describeTmsError(workspace.error)}
          message="Dispatch data could not load"
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
          <h2 className="tms-page__title">
            {approvalsOnly ? "AI dispatch approvals" : "Dispatch"}
          </h2>
          <p className="tms-page__subtitle">
            {approvalsOnly
              ? `${approvals.length} pending decisions · approve before a truck is assigned`
              : `${counts.all} active loads · ${counts.atRisk} at risk · ${counts.approvals} AI approvals pending`}
          </p>
        </div>
        <div className="tms-row">
          <Button onClick={() => navigate("/loads/create")}>New shipment</Button>
          {approvalsOnly ? (
            <Button onClick={() => navigate(routes.tmsFlow.dispatch)}>Back to dispatch</Button>
          ) : (
            <Button onClick={() => navigate(routes.tmsFlow.approvals)}>
              AI approvals ({approvals.length})
            </Button>
          )}
        </div>
      </div>

      {!approvalsOnly && collection?.truncated ? (
        <Alert
          message={`Queue covers the first ${collection.items.length.toLocaleString("en-US")} of ${collection.totalItems.toLocaleString("en-US")} loads`}
          description="Filters and counts are computed in the browser until the backend operations summary is available."
          showIcon
          type="warning"
        />
      ) : null}

      <div className="tms-dispatch">
        <FlowPanel
          testId={approvalsOnly ? "approvals-list" : "dispatch-queue"}
          title={approvalsOnly ? "Pending decisions" : "Queue"}
        >
          {approvalsOnly ? (
            <div className="tms-decision-list">
              {approvals.map((approval) => {
                const isSelected =
                  approval.suggestion.decisionId ===
                  selectedDecision?.suggestion.decisionId;
                return (
                  <button
                    className={`tms-decision-row${isSelected ? " is-selected" : ""}`}
                    data-testid={`decision-row-${approval.suggestion.decisionId}`}
                    key={approval.suggestion.decisionId}
                    onClick={() =>
                      updateParam("decision", approval.suggestion.decisionId)
                    }
                    type="button"
                  >
                    <span className="tms-decision-row__main">
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
                      </small>
                    </span>
                    <span className="tms-decision-row__meta">
                      <span>
                        #{approval.suggestion.rank} ·{" "}
                        {Number(approval.suggestion.score).toFixed(1)}
                      </span>
                      <span className="tms-muted">{approval.suggestion.confidence}</span>
                    </span>
                  </button>
                );
              })}
              {approvals.length === 0 ? (
                <p className="tms-empty">No AI dispatch decision is waiting for approval.</p>
              ) : null}
            </div>
          ) : (
            <>
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
                    {item.label} {counts[item.countKey]}
                  </button>
                ))}
              </div>
              <Input
                allowClear
                onChange={(event) => updateParam("q", event.target.value)}
                placeholder="Search load, customer, city"
                prefix={<Search size={14} aria-hidden="true" />}
                value={query}
              />
              <div className="tms-queue">
                {queue.map((shipment) => (
                  <ShipmentCard
                    compact
                    key={shipment.id}
                    onSelect={() => updateParam("shipment", shipment.id)}
                    selected={selected?.id === shipment.id}
                    shipment={shipment}
                  />
                ))}
                {queue.length === 0 ? (
                  <p className="tms-empty">No load matches this filter.</p>
                ) : null}
              </div>
            </>
          )}
        </FlowPanel>

        <div className="tms-stack">
          <TmsFlowMap
            markers={markers}
            subtitle={
              selectedLoad
                ? `${selectedLoad.originCity} → ${selectedLoad.destinationCity}`
                : undefined
            }
            testId="dispatch-map"
            title={approvalsOnly ? "Decision lane" : "Lane view"}
            vehicles={toNetworkVehicles(locatedTrucks)}
          />

          {approvalsOnly ? (
            <FlowPanel
              action={
                selectedDecision?.load ? (
                  <Button
                    icon={<ExternalLink size={14} aria-hidden="true" />}
                    onClick={() =>
                      navigate(`/tms/shipments/${selectedDecision.load?.id ?? ""}`)
                    }
                  >
                    Open load
                  </Button>
                ) : null
              }
              title="Decision detail"
            >
              {selectedDecision ? (
                <div className="tms-stack">
                  <div className="tms-row">
                    <StatusTag
                      label={selectedDecision.suggestion.confidence}
                      tone="neutral"
                    />
                    <span className="tms-muted">
                      Rank #{selectedDecision.suggestion.rank} · score{" "}
                      {Number(selectedDecision.suggestion.score).toFixed(1)}
                    </span>
                  </div>
                  <dl className="tms-detail-list">
                    <div>
                      <dt>Truck</dt>
                      <dd>
                        {selectedDecision.suggestion.truckNumber ??
                          selectedDecision.truck?.number ??
                          selectedDecision.suggestion.truckId}
                      </dd>
                    </div>
                    <div>
                      <dt>Driver</dt>
                      <dd>
                        {selectedDecision.suggestion.driverName ??
                          selectedDecision.suggestion.driverId}
                      </dd>
                    </div>
                    {selectedDecision.load ? (
                      <div>
                        <dt>Customer</dt>
                        <dd>{selectedDecision.load.customerName}</dd>
                      </div>
                    ) : null}
                    {selectedDecision.load ? (
                      <div>
                        <dt>Requested delivery</dt>
                        <dd>
                          {formatTmsDateTime(
                            selectedDecision.load.requestedDeliveryDate,
                          )}
                        </dd>
                      </div>
                    ) : null}
                    {decisionMetrics(selectedDecision).map((metric) => (
                      <div key={metric}>
                        <dt>Metric</dt>
                        <dd>{metric}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="tms-muted">{selectedDecision.suggestion.reasoning}</p>
                  <div className="tms-row">
                    <Button
                      onClick={() => setReviewed(selectedDecision)}
                      type="primary"
                    >
                      Review decision
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="tms-empty">Select a pending decision.</p>
              )}
            </FlowPanel>
          ) : (
            <FlowPanel
              action={
                selected ? (
                  <Button
                    icon={<ExternalLink size={14} aria-hidden="true" />}
                    onClick={() => navigate(`/tms/shipments/${selected.id}`)}
                  >
                    Open load
                  </Button>
                ) : null
              }
              title="Load in focus"
            >
              {selected ? (
                <dl className="tms-detail-list">
                  <div>
                    <dt>Load</dt>
                    <dd>
                      #{selected.number} · {selected.name}
                    </dd>
                  </div>
                  <div>
                    <dt>Customer</dt>
                    <dd>{selected.customerName}</dd>
                  </div>
                  <div>
                    <dt>Lane</dt>
                    <dd>
                      {selected.originCity} → {selected.destinationCity}
                    </dd>
                  </div>
                  <div>
                    <dt>Requested pickup</dt>
                    <dd>{formatTmsDateTime(selected.requestedPickupDate)}</dd>
                  </div>
                  <div>
                    <dt>Requested delivery</dt>
                    <dd>{formatTmsDateTime(selected.requestedDeliveryDate)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusTag
                        label={operationalStatusMeta[selected.status].label}
                        tone={operationalStatusMeta[selected.status].tone}
                      />
                      {selected.risk !== "none" ? (
                        <StatusTag
                          label={riskMeta[selected.risk].label}
                          tone={riskMeta[selected.risk].tone}
                        />
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt>Truck</dt>
                    <dd>
                      {selected.assignedTruckNumber ??
                        selectedTruck?.number ??
                        "Unassigned"}
                    </dd>
                  </div>
                  <div>
                    <dt>Driver</dt>
                    <dd>{selectedTruck?.mainDriverName ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt>Distance</dt>
                    <dd>{formatTmsDistance(selected.distance)}</dd>
                  </div>
                  <div>
                    <dt>Delivery cost</dt>
                    <dd>
                      {formatTmsMoney(
                        selected.deliveryCostAmount,
                        selected.deliveryCostCurrency,
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="tms-empty">Select a load from the queue.</p>
              )}
            </FlowPanel>
          )}
        </div>

        <div className="tms-stack tms-dispatch__agent">
          {approvalsOnly ? (
            <FlowPanel title="Execution timeline">
              <TmsTimeline
                emptyLabel="No timeline events for this load."
                events={timeline.data?.events ?? []}
                limit={8}
              />
            </FlowPanel>
          ) : (
            <FlowPanel
              subtitle={selected ? `Load #${selected.number}` : undefined}
              title="AI dispatch"
            >
              {focusApprovals.length === 0 ? (
                <div className="tms-stack">
                  <p className="tms-empty">
                    No AI suggestion is pending for this load.
                  </p>
                  <Button
                    icon={<Sparkles size={14} aria-hidden="true" />}
                    onClick={() => navigate(routes.aiDispatch)}
                  >
                    Open AI dispatch workspace
                  </Button>
                </div>
              ) : (
                <div className="tms-stack">
                  {focusApprovals.map((approval) => (
                    <div
                      className="tms-agent-card"
                      key={approval.suggestion.decisionId}
                    >
                      <span className="tms-agent-card__kicker">
                        <Sparkles size={14} aria-hidden="true" /> Rank #
                        {approval.suggestion.rank} · {approval.suggestion.confidence}
                      </span>
                      <h3 className="tms-agent-card__title">
                        {approval.suggestion.truckNumber ??
                          approval.suggestion.truckId}{" "}
                        · {Number(approval.suggestion.score).toFixed(1)}
                      </h3>
                      <p className="tms-agent-card__body">
                        {approval.suggestion.reasoning}
                      </p>
                      <div className="tms-row">
                        {decisionMetrics(approval).map((metric) => (
                          <span className="tms-kpi__hint" key={metric}>
                            {metric}
                          </span>
                        ))}
                      </div>
                      <div className="tms-agent-card__actions">
                        <Button
                          onClick={() => setReviewed(approval)}
                          type="primary"
                        >
                          Review and decide
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FlowPanel>
          )}

          {!approvalsOnly ? (
            <FlowPanel title="Execution timeline">
              <TmsTimeline
                emptyLabel="No timeline events for this load."
                events={timeline.data?.events ?? []}
                limit={5}
              />
            </FlowPanel>
          ) : null}

          {!approvalsOnly ? (
            <FlowPanel title="Jump to">
              <div className="tms-brief__actions">
                <button
                  className="tms-brief__action"
                  onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=at-risk`)}
                  type="button"
                >
                  <span>At-risk queue</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button
                  className="tms-brief__action"
                  onClick={() => navigate(routes.tmsFlow.approvals)}
                  type="button"
                >
                  <span>AI approvals</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </FlowPanel>
          ) : null}
        </div>
      </div>

      {reviewed ? (
        <ApproveSuggestionModal
          approval={reviewed}
          key={reviewed.suggestion.decisionId}
          onClose={() => setReviewed(null)}
          open
        />
      ) : null}
    </div>
  );
}
