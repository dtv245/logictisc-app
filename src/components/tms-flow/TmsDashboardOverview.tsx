import { Skeleton } from "antd";
import { AlertTriangle, Clock3, Sparkles, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { KpiTile } from "@/components/tms-flow/KpiTile";
import { routes } from "@/constants/routes";
import {
  dashboardCountValue,
  type TmsDashboardCount,
  type TmsDashboardModel,
} from "@/hooks/tms-flow/useTmsDashboard";
import type { TmsLoadCollection } from "@/types/tms-flow/tmsFlow.types";

function MetricValue({ count }: { count: TmsDashboardCount }) {
  const { t } = useTranslation();
  if (count.state === "loading") {
    return <Skeleton.Button active aria-label={t("tmsDashboard.refreshing")} size="small" style={{ width: 54, height: 30 }} />;
  }
  return dashboardCountValue(count) ?? "—";
}

function metricHint(count: TmsDashboardCount, readyHint: string, t: (key: string) => string): string {
  if (count.state === "loading") return t("tmsDashboard.refreshing");
  if (count.state === "error") return t("tmsDashboard.countUnavailable");
  if (count.state === "unavailable") {
    if (count.reason === "attention-filter-unavailable") return t("tmsDashboard.attentionUnavailable");
    if (count.reason === "unassigned-filter-unavailable") return t("tmsDashboard.unassignedUnavailable");
    if (count.reason === "server-filter-unavailable") return t("tmsDashboard.overdueUnavailable");
    if (count.reason === "lifecycle-filter-unavailable") return t("tmsDashboard.transitUnavailable");
    return t("tmsDashboard.serverCountUnavailable");
  }
  return readyHint;
}

function CollectionMetricValue({
  collection,
  isLoading,
}: {
  collection?: TmsLoadCollection;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  if (isLoading && !collection) {
    return <Skeleton.Button active aria-label={t("tmsDashboard.refreshing")} size="small" style={{ width: 54, height: 30 }} />;
  }
  if (!collection) return "—";
  const isLowerBound = collection.countSource === "client-fallback" && collection.truncated;
  const value = collection.totalItems.toLocaleString("vi-VN");
  return isLowerBound ? `≥ ${value}` : value;
}

function collectionHint(
  collection: TmsLoadCollection | undefined,
  readyHint: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!collection) return t("tmsDashboard.countUnavailable");
  if (collection.countSource === "client-fallback") {
    return collection.truncated
      ? t("tmsDashboard.loadedLowerBound", { count: collection.items.length })
      : t("tmsDashboard.loadedDerivedCount", { count: collection.items.length });
  }
  return readyHint;
}

export function TmsDashboardOverview({ dashboard }: { dashboard: TmsDashboardModel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspace, counts } = dashboard;
  const onFilter = (filter: string) => navigate(`${routes.tmsFlow.dispatch}?filter=${filter}`);
  const countSummary = (count: TmsDashboardCount, key: string) => metricHint(count, t(key), t);
  const pendingVisible = counts.pending.state === "ready" && counts.pending.value > 0;
  const pendingStateVisible = pendingVisible || counts.pending.state === "loading" || counts.pending.state === "error";
  const pageShipments = workspace.shipments ?? [];
  const statusGroups = [
    { key: "open", count: pageShipments.filter((shipment) => shipment.status === "open").length },
    { key: "assigned", count: pageShipments.filter((shipment) => shipment.status === "assigned").length },
    { key: "dispatched", count: pageShipments.filter((shipment) => shipment.status === "dispatched").length },
    { key: "in_transit", count: pageShipments.filter((shipment) => shipment.status === "in_transit").length },
    { key: "delivered", count: pageShipments.filter((shipment) => shipment.status === "delivered").length },
  ];
  const maxStatusCount = Math.max(1, ...statusGroups.map((group) => group.count));

  return (
    <section className="tms-dashboard-overview-column" aria-label={t("tmsDashboard.overview.title")}>
      <div className="tms-kpi-grid tms-dashboard-kpis">
        <KpiTile
          hint={collectionHint(workspace.collection, t("tmsDashboard.overview.serverTotal"), t)}
          label={<span className="tms-dashboard-kpi-label"><Truck size={15} aria-hidden="true" />{t("tmsDashboard.overview.totalLoads")}</span>}
          onClick={() => navigate(routes.tmsFlow.dispatch)}
          testId="dashboard-kpi-total-loads"
          value={<CollectionMetricValue collection={workspace.collection} isLoading={workspace.loads?.isLoading ?? false} />}
        />
        <KpiTile
          hint={workspace.riskCollection
            ? collectionHint(workspace.riskCollection, t("tmsDashboard.overview.riskHint"), t)
            : countSummary(counts.attention, "tmsDashboard.riskHint")}
          label={<span className="tms-dashboard-kpi-label"><AlertTriangle size={15} aria-hidden="true" />{t("tmsDashboard.attention")}</span>}
          onClick={() => onFilter("at-risk")}
          testId="dashboard-kpi-at-risk"
          tone="warning"
          value={workspace.riskCollection
            ? <CollectionMetricValue collection={workspace.riskCollection} isLoading={workspace.riskLoads.isLoading} />
            : <MetricValue count={counts.attention} />}
        />
        <KpiTile
          hint={workspace.unassignedCollection
            ? collectionHint(workspace.unassignedCollection, t("tmsDashboard.overview.unassignedHint"), t)
            : countSummary(counts.unassigned, "tmsDashboard.unassignedHint")}
          label={<span className="tms-dashboard-kpi-label"><Truck size={15} aria-hidden="true" />{t("tmsDashboard.unassigned")}</span>}
          onClick={() => onFilter("unassigned")}
          testId="dashboard-kpi-unassigned"
          value={workspace.unassignedCollection
            ? <CollectionMetricValue collection={workspace.unassignedCollection} isLoading={workspace.unassignedLoads.isLoading} />
            : <MetricValue count={counts.unassigned} />}
        />
        {pendingStateVisible ? (
          <KpiTile
            hint={countSummary(counts.pending, "tmsDashboard.pendingHint")}
            label={<span className="tms-dashboard-kpi-label"><Sparkles size={15} aria-hidden="true" />{t("tmsDashboard.pending")}</span>}
            onClick={pendingVisible ? () => onFilter("ai-pending") : undefined}
            testId="dashboard-kpi-pending"
            value={<MetricValue count={counts.pending} />}
          />
        ) : null}
      </div>

      <div className="tms-dashboard-secondary-stats">
        <KpiTile
          hint={countSummary(counts.overdue, "tmsDashboard.overduePickupHint")}
          label={<span className="tms-dashboard-kpi-label"><Clock3 size={14} aria-hidden="true" />{t("tmsDashboard.overdue")}</span>}
          onClick={() => onFilter("overdue")}
          testId="dashboard-kpi-overdue"
          tone="danger"
          value={<MetricValue count={counts.overdue} />}
        />
        <KpiTile
          hint={countSummary(counts.inTransit, "tmsDashboard.transitHint")}
          label={<span className="tms-dashboard-kpi-label"><Truck size={14} aria-hidden="true" />{t("tmsDashboard.inTransit")}</span>}
          onClick={() => onFilter("in-transit")}
          testId="dashboard-kpi-in-transit"
          value={<MetricValue count={counts.inTransit} />}
        />
      </div>

      <FlowPanel className="tms-dashboard-status" title={t("tmsDashboard.overview.statusTitle")}>
        <div className="tms-dashboard-status__list">
          {statusGroups.map((group) => (
            <div className="tms-dashboard-status__row" key={group.key}>
              <span>{t(`tmsDashboard.statuses.${group.key}`)}</span>
              <span className="tms-dashboard-status__track" aria-hidden="true">
                <i style={{ width: `${(group.count / maxStatusCount) * 100}%` }} />
              </span>
              <strong>{group.count.toLocaleString("vi-VN")}</strong>
            </div>
          ))}
        </div>
        <p className="tms-dashboard-status__scope">
          {t("tmsDashboard.overview.loadedScope", { count: pageShipments.length })}
        </p>
      </FlowPanel>
    </section>
  );
}
