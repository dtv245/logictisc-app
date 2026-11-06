import { Alert, Button, Skeleton } from "antd";
import { AlertTriangle, ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { FlowPanel } from "@/components/tms-flow/FlowPanel";
import { routes } from "@/constants/routes";
import type { TmsDashboardModel } from "@/hooks/tms-flow/useTmsDashboard";
import { formatTmsDateTime, describeTmsError } from "@/utils/tms-flow/presentation";

const shipmentHref = (shipmentId: string) =>
  routes.tmsFlow.shipment.replace(":shipmentId", encodeURIComponent(shipmentId));

export function TmsDashboardWorkQueue({ dashboard }: { dashboard: TmsDashboardModel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspace } = dashboard;
  const approvals = workspace.approvals ?? [];
  const riskShipments = workspace.riskShipments ?? [];
  const pendingCount = workspace.pending?.data?.length ?? approvals.length;
  const riskCount = workspace.riskCollection?.totalItems ?? riskShipments.length;
  const isApprovalsLoading = Boolean(workspace.pending?.isLoading && !workspace.pending.data);
  const isRiskLoading = Boolean(workspace.riskLoads?.isLoading && !workspace.riskCollection);

  return (
    <FlowPanel
      action={(
        <Button
          icon={<ArrowUpRight size={14} aria-hidden="true" />}
          onClick={() => navigate(routes.tmsFlow.dispatch)}
          size="small"
        >
          {t("tmsDashboard.queue.openDispatch")}
        </Button>
      )}
      className="tms-dashboard-queue"
      subtitle={t("tmsDashboard.queue.subtitle")}
      testId="tms-dashboard-work-queue"
      title={t("tmsDashboard.queue.title")}
    >
      <section className="tms-dashboard-queue__group" aria-label={t("tmsDashboard.queue.approvals")}>
        <header className="tms-dashboard-queue__group-heading">
          <span><Sparkles size={14} aria-hidden="true" />{t("tmsDashboard.queue.approvals")}</span>
          <strong>{isApprovalsLoading ? "…" : pendingCount.toLocaleString()}</strong>
        </header>
        {workspace.approvalsError ? (
          <Alert
            description={describeTmsError(workspace.approvalsError)}
            message={t("tmsDashboard.queue.approvalsError")}
            showIcon
            type="warning"
          />
        ) : isApprovalsLoading ? (
          <div className="tms-dashboard-queue__loading" aria-busy="true">
            <Skeleton active title={false} paragraph={{ rows: 2 }} />
          </div>
        ) : approvals.length > 0 ? (
          <div className="tms-dashboard-queue__list">
            {approvals.slice(0, 3).map((approval) => {
              const shipment = approval.load;
              const title = shipment
                ? `#${shipment.number} · ${shipment.originCity} → ${shipment.destinationCity}`
                : t("tmsDashboard.queue.decision", {
                    id: approval.suggestion.decisionId.slice(0, 8),
                  });
              const assignment = [
                approval.suggestion.truckNumber ?? approval.suggestion.truckId,
                approval.suggestion.driverName,
              ].filter(Boolean).join(" · ");

              return (
                <button
                  className="tms-dashboard-queue__item"
                  key={approval.suggestion.decisionId}
                  onClick={() => navigate(shipment ? shipmentHref(shipment.id) : routes.tmsFlow.approvals)}
                  type="button"
                >
                  <span className="tms-dashboard-queue__icon tms-dashboard-queue__icon--ai">
                    <Sparkles size={15} aria-hidden="true" />
                  </span>
                  <span className="tms-dashboard-queue__copy">
                    <strong>{title}</strong>
                    <small>{assignment || t("tmsDashboard.queue.noAssignment")}</small>
                  </span>
                  <span className="tms-dashboard-queue__badge tms-dashboard-queue__badge--ai">
                    {t("tmsDashboard.queue.awaiting")}
                  </span>
                  <ArrowUpRight className="tms-dashboard-queue__open" size={15} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="tms-dashboard-queue__empty-group">{t("tmsDashboard.queue.noApprovals")}</p>
        )}
      </section>

      <section className="tms-dashboard-queue__group" aria-label={t("tmsDashboard.queue.atRisk")}>
        <header className="tms-dashboard-queue__group-heading">
          <span><AlertTriangle size={14} aria-hidden="true" />{t("tmsDashboard.queue.atRisk")}</span>
          <strong>{isRiskLoading ? "…" : riskCount.toLocaleString()}</strong>
        </header>
        {workspace.riskError && riskShipments.length === 0 ? (
          <Alert
            description={describeTmsError(workspace.riskError)}
            message={t("tmsDashboard.queue.riskError")}
            showIcon
            type="warning"
          />
        ) : isRiskLoading ? (
          <div className="tms-dashboard-queue__loading" aria-busy="true">
            <Skeleton active title={false} paragraph={{ rows: 2 }} />
          </div>
        ) : riskShipments.length > 0 ? (
          <div className="tms-dashboard-queue__list">
            {riskShipments.slice(0, 4).map((shipment) => {
              const delayed = shipment.risk === "delayed";
              const detail = [
                shipment.assignedTruckNumber ?? t("tmsDashboard.noTruck"),
                shipment.requestedDeliveryDate
                  ? formatTmsDateTime(shipment.requestedDeliveryDate)
                  : undefined,
              ].filter(Boolean).join(" · ");

              return (
                <button
                  className="tms-dashboard-queue__item"
                  key={shipment.id}
                  onClick={() => navigate(shipmentHref(shipment.id))}
                  type="button"
                >
                  <span className={`tms-dashboard-queue__icon ${delayed ? "tms-dashboard-queue__icon--danger" : "tms-dashboard-queue__icon--warning"}`}>
                    {delayed ? <AlertTriangle size={15} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}
                  </span>
                  <span className="tms-dashboard-queue__copy">
                    <strong>#{shipment.number} · {shipment.originCity} → {shipment.destinationCity}</strong>
                    <small>{shipment.riskReasons?.[0]?.message ?? detail}</small>
                  </span>
                  <span className={`tms-dashboard-queue__badge ${delayed ? "tms-dashboard-queue__badge--danger" : "tms-dashboard-queue__badge--warning"}`}>
                    {t(delayed ? "tmsDashboard.queue.delayed" : "tmsDashboard.queue.dueSoon")}
                  </span>
                  <ArrowUpRight className="tms-dashboard-queue__open" size={15} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        ) : approvals.length > 0 ? (
          <p className="tms-dashboard-queue__empty-group">{t("tmsDashboard.queue.noRisk")}</p>
        ) : (
          <p className="tms-dashboard-queue__empty-group">{t("tmsDashboard.queue.empty")}</p>
        )}
      </section>
    </FlowPanel>
  );
}
