import React, { useMemo } from "react";
import dayjs from "dayjs";
import { useDashboardData } from "../hooks/useDashboardData";
import { DEFAULT_CURRENCY, INITIAL_DASHBOARD_FILTERS } from "../config/rankingWeights";
import type { DashboardFilters } from "../types";
import type { KpiItemProps } from "../types/primitives.types";
import { DashboardHeader } from "./DashboardHeader";
import { KpiStrip } from "./KpiStrip";
import { PriorityShipmentCard } from "./PriorityShipmentCard";
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
  const today = dayjs();
  const filters: DashboardFilters = useMemo(
    () => ({
      ...INITIAL_DASHBOARD_FILTERS,
      from: today.subtract(30, "day").format("YYYY-MM-DD"),
      to: today.format("YYYY-MM-DD"),
      currency: DEFAULT_CURRENCY,
      ...initialFilters,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialFilters],
  );

  // Fetch real queries using existing useDashboardData
  const dashboardData = useDashboardData(filters, { enableFinancials: false });

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
        label: "Đang trên đường",
        value: null,
        state: "unavailable",
      },
      {
        label: "Nguy cơ trễ (At Risk)",
        value: delaysCount,
        context: "ETA sát giờ SLA",
        state: getKpiState(delays.isLoading, delays.error, delaysCount),
      },
      {
        label: "Đúng giờ (OTD)",
        value: otdValue,
        state: getKpiState(otd.isLoading, otd.error, otdValue),
      },
      {
        label: "Đã giao hôm nay",
        value: null,
        state: "unavailable",
      },
      {
        label: "Xe sẵn sàng gán",
        value: null,
        state: "unavailable",
      },
      {
        label: "Ngoại lệ phát sinh",
        value: exceptionsCount,
        context: "Sự cố giao nhận",
        state: getKpiState(exceptions.isLoading, exceptions.error, exceptionsCount),
      },
    ];
  }, [dashboardData]);

  return (
    <div className={`ops-dashboard-layout ${className}`}>
      {/* 1. Header (Full Width) */}
      <div className="ops-grid-area-header">
        <DashboardHeader onRefresh={dashboardData.refetchAll} />
      </div>

      {/* 2. KPI Strip (Full Width) */}
      <div className="ops-grid-area-kpi">
        <KpiStrip items={kpiItems} />
      </div>

      {/* 3. Priority Shipment Card (8 cols) & Operations Brief (4 cols) */}
      <div className="ops-grid-area-priority">
        <PriorityShipmentCard />
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
