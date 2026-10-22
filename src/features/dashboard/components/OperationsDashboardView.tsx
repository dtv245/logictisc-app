import React, { useMemo } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PriorityShipmentCard } from "@/components/dashboard/PriorityShipmentCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePriorityShipments } from "@/hooks/dashboard/usePriorityShipments";
import { DEFAULT_CURRENCY, INITIAL_DASHBOARD_FILTERS } from "../config/rankingWeights";
import type { DashboardFilters } from "../types";
import type { KpiItemProps } from "../types/primitives.types";
import { DashboardHeader } from "./DashboardHeader";
import { KpiStrip } from "./KpiStrip";
import { OperationsBrief } from "./OperationsBrief";
import { NetworkMiniMap } from "./NetworkMiniMap";
import { DispatchTimeline } from "./DispatchTimeline";
import "./OperationsDashboardView.scss";

export interface OperationsDashboardViewProps {
  initialFilters?: Partial<DashboardFilters>;
  className?: string;
}

const getKpiState = (
  isLoading: boolean,
  error: unknown,
  value: number | null,
): KpiItemProps["state"] => {
  if (isLoading) return "loading";
  if (error) return "error";
  return value === null ? "unavailable" : "ready";
};

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({
  initialFilters,
  className = "",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const filters: DashboardFilters = useMemo(
    () => {
      const today = dayjs();
      return {
        ...INITIAL_DASHBOARD_FILTERS,
        from: today.subtract(30, "day").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
        currency: DEFAULT_CURRENCY,
        ...initialFilters,
      };
    },
    [initialFilters],
  );

  // Fetch real queries using existing useDashboardData
  const dashboardData = useDashboardData(filters, { enableFinancials: false });
  // Priority panel has a real load source; the other panels stay unavailable.
  const priorityShipments = usePriorityShipments();

  // KPI chỉ dùng field có trong response hiện tại; thiếu field không được thay bằng số mẫu.
  const kpiItems: KpiItemProps[] = useMemo(() => {
    const otd = dashboardData.otd;
    const delays = dashboardData.delays;
    const exceptions = dashboardData.exceptions;

    const otdValue = typeof otd.data?.otdPercentage === "number" && Number.isFinite(otd.data.otdPercentage)
      ? Math.round(otd.data.otdPercentage)
      : null;
    const delaysCount = typeof delays.data?.totalLateLoads === "number" && Number.isFinite(delays.data.totalLateLoads)
      ? delays.data.totalLateLoads
      : null;
    const exceptionsCount = typeof exceptions.data?.totalExceptions === "number" && Number.isFinite(exceptions.data.totalExceptions)
      ? exceptions.data.totalExceptions
      : null;

    return [
      {
        label: t("dashboard.opsView.kpi.inTransit"),
        value: null,
        state: "unavailable",
      },
      {
        label: t("dashboard.opsView.kpi.atRisk"),
        value: delaysCount,
        context: t("dashboard.opsView.kpi.atRiskContext"),
        state: getKpiState(delays.isLoading, delays.error, delaysCount),
      },
      {
        label: t("dashboard.opsView.kpi.onTime"),
        value: otdValue,
        state: getKpiState(otd.isLoading, otd.error, otdValue),
      },
      {
        label: t("dashboard.opsView.kpi.deliveredToday"),
        value: null,
        state: "unavailable",
      },
      {
        label: t("dashboard.opsView.kpi.assignableVehicles"),
        value: null,
        state: "unavailable",
      },
      {
        label: t("dashboard.opsView.kpi.exceptions"),
        value: exceptionsCount,
        context: t("dashboard.opsView.kpi.exceptionsContext"),
        state: getKpiState(exceptions.isLoading, exceptions.error, exceptionsCount),
      },
    ];
  }, [dashboardData, t]);

  return (
    <div className={`ops-dashboard-layout ${className}`}>
      {/* 1. Header (Full Width) */}
      <div className="ops-grid-area-header">
        <DashboardHeader />
      </div>

      {/* 2. KPI Strip (Full Width) */}
      <div className="ops-grid-area-kpi">
        <KpiStrip items={kpiItems} onRetry={dashboardData.refetchAll} />
      </div>

      {/* 3. Priority Shipment Card (8 cols) & Operations Brief (4 cols) */}
      <div className="ops-grid-area-priority">
        <PriorityShipmentCard
          error={priorityShipments.error}
          isLoading={priorityShipments.isLoading}
          isUnavailable={priorityShipments.isUnavailable}
          locale={priorityShipments.locale}
          onRetry={priorityShipments.retry}
          onSelectShipment={(shipmentId) => navigate(`/tms/shipments/${shipmentId}`)}
          shipments={priorityShipments.shipments}
        />
      </div>

      <div className="ops-grid-area-brief">
        <OperationsBrief />
      </div>

      {/* 4. Mini Map (4 cols) & Dispatch Timeline (8 cols) */}
      <div className="ops-grid-area-map">
        <NetworkMiniMap />
      </div>

      <div className="ops-grid-area-timeline">
        <DispatchTimeline />
      </div>
    </div>
  );
};

export default OperationsDashboardView;
