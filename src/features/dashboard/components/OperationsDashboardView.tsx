import React, { useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePriorityShipments } from "@/hooks/dashboard/usePriorityShipments";
import { useTmsLoads, useTmsTrucks } from "@/hooks/tms-flow/useTmsQueries";
import { countTmsRiskQueue, summarizeTmsLoads } from "@/utils/tms-flow/status";
import { toNetworkVehicles } from "@/utils/tms-flow/map";
import { describeTmsError } from "@/utils/tms-flow/presentation";
import { DEFAULT_CURRENCY, INITIAL_DASHBOARD_FILTERS } from "../config/rankingWeights";
import type { DashboardFilters } from "@/types/dashboard/dashboard.types";
import type { KpiItemProps } from "@/types/dashboard/primitives.types";
import { DashboardHeader } from "./DashboardHeader";
import { KpiStrip } from "./KpiStrip";
import { OperationsBrief } from "./OperationsBrief";
import { NetworkMiniMap } from "./NetworkMiniMap";
import { DispatchTimeline } from "./DispatchTimeline";
import { PriorityShipmentCard } from "./PriorityShipmentCard";
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
  const { otd, exceptions, refetchAll } = dashboardData;
  // Priority panel has a real load source; the other panels stay unavailable.
  const priorityShipments = usePriorityShipments();
  // Dispatch and the operations KPIs must read the same load queue so a load
  // counted as at risk on Dispatch is counted here too.
  const loads = useTmsLoads();
  const trucks = useTmsTrucks();
  const networkVehicles = useMemo(
    () => toNetworkVehicles(trucks.data?.items ?? []),
    [trucks.data?.items],
  );
  const onRoadCount = useMemo(
    () => networkVehicles.filter((vehicle) => vehicle.status === "moving").length,
    [networkVehicles],
  );
  const loadSummary = useMemo(
    () =>
      loads.data
        ? summarizeTmsLoads(
            loads.data.shipments,
            new Date(loads.data.generatedAt),
          )
        : null,
    [loads.data],
  );

  // KPI chỉ dùng field có trong response hiện tại; thiếu field không được thay bằng số mẫu.
  const kpiItems: KpiItemProps[] = useMemo(() => {
    const otdValue = typeof otd.data?.otdPercentage === "number" && Number.isFinite(otd.data.otdPercentage)
      ? Math.round(otd.data.otdPercentage)
      : null;
    const exceptionsCount = typeof exceptions.data?.totalExceptions === "number" && Number.isFinite(exceptions.data.totalExceptions)
      ? exceptions.data.totalExceptions
      : null;

    const liveValue = (pick: (summary: NonNullable<typeof loadSummary>) => number) =>
      loadSummary ? pick(loadSummary) : null;
    const liveState = (value: number | null) =>
      getKpiState(loads.isLoading, loads.error, value);
    const inTransit = liveValue((summary) => summary.inTransit);
    const atRisk = liveValue(countTmsRiskQueue);
    const deliveredToday = liveValue((summary) => summary.deliveredToday);

    return [
      {
        label: t("dashboard.opsView.kpi.inTransit"),
        value: inTransit,
        state: liveState(inTransit),
      },
      {
        label: t("dashboard.opsView.kpi.atRisk"),
        value: atRisk,
        context: t("dashboard.opsView.kpi.atRiskContext"),
        state: liveState(atRisk),
      },
      {
        label: t("dashboard.opsView.kpi.onTime"),
        value: otdValue,
        context: t("dashboard.opsView.kpi.periodContext"),
        state: getKpiState(otd.isLoading, otd.error, otdValue),
      },
      {
        label: t("dashboard.opsView.kpi.deliveredToday"),
        value: deliveredToday,
        state: liveState(deliveredToday),
      },
      {
        // Không có API/field xác nhận trạng thái "sẵn sàng gán"; giữ trạng thái
        // chưa có dữ liệu thay vì suy ra từ tổng số xe.
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
  }, [otd, exceptions, loadSummary, loads.isLoading, loads.error, t]);

  const retryAll = useCallback(() => {
    void loads.refetch();
    refetchAll();
  }, [loads, refetchAll]);

  const handleSelectShipment = useCallback(
    (shipmentId: string) => {
      navigate(`/tms/shipments/${shipmentId}`);
    },
    [navigate],
  );

  const handleTrucksRetry = useCallback(() => {
    void trucks.refetch();
  }, [trucks]);

  return (
    <div className={`ops-dashboard-layout ${className}`}>
      {/* 1. Orientation: page title, date, search, and primary actions. */}
      <div className="ops-grid-area-header">
        <DashboardHeader />
      </div>

      {/* 2. Summary: current operating metrics before the actionable detail. */}
      <div className="ops-grid-area-kpi">
        <KpiStrip items={kpiItems} onRetry={retryAll} />
        {loads.data ? (
          <p className="ops-kpi-scope">
            {loads.data.collection.truncated
              ? t("dashboard.opsView.kpi.loadScopeTruncated", {
                  shown: loads.data.collection.items.length,
                  total: loads.data.collection.totalItems,
                })
              : t("dashboard.opsView.kpi.loadScope", {
                  count: loads.data.shipments.length,
                })}
          </p>
        ) : null}
      </div>

      {/* 3. Action: highlight the load that should be handled first. */}
      <div className="ops-grid-area-priority">
        <PriorityShipmentCard
          error={priorityShipments.error}
          isLoading={priorityShipments.isLoading}
          isUnavailable={priorityShipments.isUnavailable}
          locale={priorityShipments.locale}
          onRetry={priorityShipments.retry}
          onSelectShipment={handleSelectShipment}
          shipments={priorityShipments.shipments}
        />
      </div>

      {/* 4. Context: operational analysis beside the network map. */}
      <div className="ops-grid-area-brief">
        <OperationsBrief />
      </div>

      <div className="ops-grid-area-map">
        <NetworkMiniMap
          error={!trucks.data && trucks.error ? describeTmsError(trucks.error) : undefined}
          isLoading={trucks.isLoading}
          onRetry={handleTrucksRetry}
          onRoadCount={onRoadCount}
          vehicles={networkVehicles}
        />
      </div>

      {/* 5. Schedule: finish with driver availability and dispatch blocks. */}
      <div className="ops-grid-area-timeline">
        <DispatchTimeline />
      </div>
    </div>
  );
};

export default OperationsDashboardView;
