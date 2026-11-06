import { Alert, Button, Skeleton, Tag } from "antd";
import { AlertTriangle, ArrowRight, Clock3, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { TmsDashboardOverview } from "@/components/tms-flow/TmsDashboardOverview";
import { TmsDashboardWorkQueue } from "@/components/tms-flow/TmsDashboardWorkQueue";
import { TmsFleetMap } from "@/components/tms-flow/TmsFleetMap";
import { TmsTimeline } from "@/components/tms-flow/TmsTimeline";
import { routes } from "@/constants/routes";
import type { TmsDashboardModel } from "@/hooks/tms-flow/useTmsDashboard";
import { getDashboardStatusLabel } from "@/utils/tms-flow/dashboardPresentation";
import { formatTmsOverdueDuration, getTmsOverdue } from "@/utils/tms-flow/overdue";
import { formatTmsDateTime, describeTmsError } from "@/utils/tms-flow/presentation";

function overdueDescription(
  shipment: NonNullable<TmsDashboardModel["primary"]>,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | undefined {
  const overdue = getTmsOverdue(shipment.raw);
  if (overdue.reasons.length === 0) return undefined;
  return overdue.reasons.map((reason) => {
    const duration = formatTmsOverdueDuration(reason.overdueMilliseconds);
    return t("tmsDashboard.overdueReason", {
      phase: t(reason.kind === "pickup" ? "tmsDashboard.pickupPhase" : "tmsDashboard.deliveryPhase"),
      amount: duration.amount,
      unit: t(duration.unit === "days" ? "tmsDashboard.dayUnit" : "tmsDashboard.hourUnit"),
    });
  }).join(" · ");
}


export interface TmsDashboardContentProps {
  dashboard: TmsDashboardModel;
}

export function TmsDashboardContent({ dashboard }: TmsDashboardContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspace, primary, nextAction, timeline, counts } = dashboard;
  const primaryAction = primary
    ? () => navigate(`${routes.tmsFlow.dispatch}?shipment=${encodeURIComponent(primary.id)}`)
    : undefined;
  const noWorkConfirmed =
    !primary && counts.attention.state === "ready" && counts.attention.value === 0 &&
    counts.unassigned.state === "ready" && counts.unassigned.value === 0;
  const updatedTime = dashboard.updatedAt
    ? new Date(dashboard.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : undefined;
  const refreshDashboard = () => {
    void workspace.loads.refetch();
    void workspace.riskLoads.refetch();
    void workspace.unassignedLoads.refetch();
    void workspace.trucks.refetch();
    void workspace.pending.refetch();
    void workspace.statuses.refetch();
    void timeline.refetch();
  };

  return (
    <div className="tms-page tms-dashboard-page" data-testid="tms-dashboard">
      <header className="tms-dashboard-hero">
        <div>
          <span className="tms-dashboard-eyebrow">{t("tmsDashboard.eyebrow")}</span>
          <h1 className="tms-page__title">{t("tmsDashboard.title")}</h1>
          <div aria-live="polite" className="tms-dashboard-hero__summary">
            {dashboard.isPriorityLoading ? (
              <Skeleton active title={false} paragraph={{ rows: 1, width: "60%" }} />
            ) : primary ? (
              t("tmsDashboard.primarySummary", { number: primary.number })
            ) : noWorkConfirmed ? (
              t("tmsDashboard.noWork")
            ) : (
              t("tmsDashboard.priorityUnavailable")
            )}
          </div>
          <div className="tms-dashboard-hero__freshness" aria-live="polite">
            {dashboard.refreshFailed ? (
              <span className="is-warning"><AlertTriangle size={14} aria-hidden="true" /> {t("tmsDashboard.refreshFailed")}</span>
            ) : dashboard.workspace.isRefreshing ? (
              <span><RefreshCw size={14} aria-hidden="true" /> {t("tmsDashboard.refreshing")}</span>
            ) : updatedTime ? (
              <span><Clock3 size={14} aria-hidden="true" /> {t("tmsDashboard.updated", { time: updatedTime })}</span>
            ) : null}
          </div>
        </div>
        <div className="tms-dashboard-hero__actions">
          <Button icon={<RefreshCw size={14} aria-hidden="true" />} onClick={refreshDashboard}>
            {t("tmsDashboard.refresh")}
          </Button>
          <Button onClick={() => navigate(routes.tmsFlow.dispatch)}>
            {t("tmsDashboard.openDispatch")}
          </Button>
          {primaryAction ? (
            <Button className="tms-control-button" onClick={primaryAction} type="primary">
              {t("tmsDashboard.start")}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="tms-dashboard-grid tms-dashboard-layout">
        <TmsDashboardOverview dashboard={dashboard} />
        <TmsDashboardWorkQueue dashboard={dashboard} />

        <div className="tms-dashboard-map-area">
          <TmsFleetMap
            collection={workspace.trucks.data}
            error={workspace.trucksError}
            isLoading={workspace.trucks.isLoading}
            riskLoads={workspace.riskShipments ?? []}
          />
        </div>

        <aside className="tms-dashboard-side-column">
          <FlowPanel
            action={primaryAction ? (
              <Button className="tms-control-button" icon={<ArrowRight size={14} aria-hidden="true" />} onClick={primaryAction} type="primary">
                {t("tmsDashboard.processLoad")}
              </Button>
            ) : null}
            subtitle={primary ? `${primary.originCity} → ${primary.destinationCity}` : undefined}
            testId="dashboard-primary-load"
            title={t("tmsDashboard.loadLabel")}
          >
            {primary ? (
              <div className="tms-dashboard-primary">
                <div className="tms-dashboard-primary__heading">
                  <strong className="tms-dashboard-primary__number">#{primary.number}</strong>
                  <Tag>{getDashboardStatusLabel(primary.status, t)}</Tag>
                </div>
                <p className="tms-dashboard-primary__customer">{primary.customerName}</p>
                <div className="tms-dashboard-primary__facts">
                  {primary.requestedPickupDate ? (
                    <p><span>{t("tmsDashboard.requestedPickup")}</span><strong>{formatTmsDateTime(primary.requestedPickupDate)}</strong></p>
                  ) : null}
                  {primary.requestedDeliveryDate ? (
                    <p><span>{t("tmsDashboard.requestedDelivery")}</span><strong>{formatTmsDateTime(primary.requestedDeliveryDate)}</strong></p>
                  ) : null}
                  <p><span>{t("tmsDashboard.assignedTruck")}</span><strong>{primary.assignedTruckNumber ?? t("tmsDashboard.noTruck")}</strong></p>
                </div>
                {overdueDescription(primary, t) ? (
                  <p className="tms-dashboard-primary__overdue" data-testid="dashboard-primary-overdue">
                    <AlertTriangle size={16} aria-hidden="true" /> {overdueDescription(primary, t)}
                  </p>
                ) : null}
                {nextAction.kind === "risk" ? (
                  <p className="tms-dashboard-primary__next">{nextAction.reason}</p>
                ) : nextAction.kind === "approve-suggestion" ? (
                  <p className="tms-dashboard-primary__next">{t("tmsDashboard.nextApproval")}</p>
                ) : nextAction.kind === "manual-assignment-unavailable" ? (
                  <p className="tms-dashboard-primary__next">{t("tmsDashboard.nextUnassigned")}</p>
                ) : null}
              </div>
            ) : (
              <p className="tms-empty">{noWorkConfirmed ? t("tmsDashboard.emptyLoad") : t("tmsDashboard.priorityUnavailable")}</p>
            )}
          </FlowPanel>

          <FlowPanel
            subtitle={primary ? t("tmsDashboard.timelineFor", { number: primary.number }) : undefined}
            testId="dashboard-timeline-panel"
            title={t("tmsDashboard.timeline")}
          >
            {timeline.isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} aria-label={t("tmsDashboard.timelineLoading")} />
            ) : timeline.error && !timeline.data ? (
              <Alert description={describeTmsError(timeline.error)} message={t("tmsDashboard.timelineError")} showIcon type="warning" />
            ) : (
              <TmsTimeline
                collapsible
                emptyLabel={t("tmsDashboard.timelineEmpty")}
                events={timeline.data?.events ?? []}
                initialVisibleCount={5}
              />
            )}
          </FlowPanel>
        </aside>
      </div>
    </div>
  );
}
