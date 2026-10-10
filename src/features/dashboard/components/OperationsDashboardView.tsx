import React, { useState } from "react";
import { Col, Row, Space } from "antd";
import { useCan } from "@refinedev/core";
import dayjs from "dayjs";

import { TopFilterBar } from "./TopFilterBar";
import { KpiCards } from "./KpiCards";
import { FinancialSection } from "./FinancialSection";
import { OperationsSection } from "./OperationsSection";
import { DriverRankingTable } from "./DriverRankingTable";
import { ProfitabilityRankingsTable } from "./ProfitabilityRankingsTable";
import { useDashboardData } from "../hooks/useDashboardData";
import { useDriverRanking } from "../hooks/useDriverRanking";
import type { DashboardFilters } from "../types";
import {
  DEFAULT_CURRENCY,
  INITIAL_DASHBOARD_FILTERS,
} from "../config/rankingWeights";

export interface OperationsDashboardViewProps {
  initialFilters?: Partial<DashboardFilters>;
  className?: string;
}

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({
  initialFilters,
  className,
}) => {
  // Check role authorization for financial metrics
  const profitAccess = useCan({ resource: "profitability", action: "PROFITABILITY_VIEW" });
  const invoiceAccess = useCan({ resource: "invoices", action: "BILLING_VIEW" });
  const canViewFinancials = profitAccess.data?.can === true || invoiceAccess.data?.can === true;

  // Initialize filters
  const today = dayjs();
  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    ...INITIAL_DASHBOARD_FILTERS,
    from: today.subtract(30, "day").format("YYYY-MM-DD"),
    to: today.format("YYYY-MM-DD"),
    currency: DEFAULT_CURRENCY,
    ...initialFilters,
  }));

  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());

  // Dashboard queries
  const dashboardData = useDashboardData(filters, {
    enableFinancials: canViewFinancials,
  });

  // Driver ranking query
  const driverRankingData = useDriverRanking(filters);

  const handleRefresh = () => {
    dashboardData.refetchAll();
    driverRankingData.refetch();
    setLastRefreshed(new Date());
  };

  const isRefreshing =
    dashboardData.monthlyTrend.isFetching ||
    dashboardData.expenses.isFetching ||
    dashboardData.otd.isFetching ||
    driverRankingData.isFetching;

  const handleExportCsv = () => {
    // Generate simple CSV of current KPIs and driver rankings
    const rows = [
      ["Báo cáo", "Dashboard Điều Phối Vận Hành"],
      ["Khoảng thời gian", `${filters.from} - ${filters.to}`],
      ["Loại tiền tệ", filters.currency],
      [],
      ["Hạng", "Tài xế", "Điểm", "Hoàn thành đơn", "Tổng dặm", "Đúng giờ %", "Doanh thu"],
      ...(driverRankingData.data?.drivers || []).map((d) => [
        d.rank,
        d.driverName,
        d.score,
        d.completedLoads,
        d.totalMiles,
        `${d.onTimePercent}%`,
        d.revenue,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard_report_${filters.from}_${filters.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingBottom: 40,
      }}
    >
      {/* Sticky Top Filter Bar */}
      <TopFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        isRefreshing={isRefreshing}
        lastUpdated={lastRefreshed}
      />

      <div style={{ padding: "0 24px" }}>
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {/* Row 1: KPI Cards (4-6 thẻ) */}
          <KpiCards
            currency={filters.currency}
            monthlyTrendPoints={dashboardData.monthlyTrend.points}
            expenses={dashboardData.expenses}
            prevExpenses={dashboardData.prevExpenses}
            operatingCpm={dashboardData.operatingCpm}
            prevOperatingCpm={dashboardData.prevOperatingCpm}
            otd={dashboardData.otd}
            prevOtd={dashboardData.prevOtd}
            fleetCount={{
              totalTrucks: dashboardData.counts.totalTrucks,
              totalLoads: dashboardData.counts.totalLoads,
            }}
            enableFinancials={canViewFinancials}
          />

          {/* Row 2: Financial Charts (Doanh thu/Chi phí/Lợi nhuận theo tháng + Chi phí theo hạng mục) */}
          {canViewFinancials && (
            <FinancialSection
              currency={filters.currency}
              monthlyTrendPoints={dashboardData.monthlyTrend.points}
              monthlyTrendLoading={dashboardData.monthlyTrend.isLoading}
              onRefreshMonthly={dashboardData.monthlyTrend.refetch}
              expenses={dashboardData.expenses}
              fuel={dashboardData.fuel}
              maintenance={dashboardData.maintenance}
            />
          )}

          {/* Row 3: Operations Indicators (OTD, Delays, Exceptions, Transit Time, Fleet) */}
          <OperationsSection
            otd={dashboardData.otd}
            delays={dashboardData.delays}
            transitTime={dashboardData.transitTime}
            exceptions={dashboardData.exceptions}
            counts={{
              totalLoads: dashboardData.counts.totalLoads,
              totalTrips: dashboardData.counts.totalTrips,
              totalTrucks: dashboardData.counts.totalTrucks,
            }}
          />

          {/* Row 4: Rankings (Top 10 Tài xế + Top/Bottom Tuyến đường & Xe theo lợi nhuận) */}
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={canViewFinancials ? 12 : 24}>
              <DriverRankingTable
                drivers={driverRankingData.data?.drivers || []}
                isLoading={driverRankingData.isLoading}
                isMock={driverRankingData.isMock}
                sortBy={driverRankingData.sortBy}
                onSortChange={driverRankingData.setSortBy}
                currency={filters.currency}
                onRetry={driverRankingData.refetch}
                error={driverRankingData.error}
              />
            </Col>

            {canViewFinancials && (
              <Col xs={24} xl={12}>
                <ProfitabilityRankingsTable
                  laneRankings={dashboardData.laneProfitability}
                  truckRankings={dashboardData.truckProfitability}
                  currency={filters.currency}
                />
              </Col>
            )}
          </Row>
        </Space>
      </div>
    </div>
  );
};
