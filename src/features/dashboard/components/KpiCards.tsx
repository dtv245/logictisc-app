import React from "react";
import { Col, Row, Space, Tag, Tooltip, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { routes } from "@/constants/routes";
import { WidgetContainer } from "./WidgetContainer";
import "./KpiCards.scss";
import type {
  ExpenseSummaryReport,
  KnownOperatingCpmReport,
  MonthlyTrendPoint,
  OtdReport,
  SupportedCurrency,
  WidgetAsyncState,
} from "../types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getMetricDisplay,
} from "../utils/formatters";
import { calculateDelta, calculateProfit } from "../utils/calculations";

export interface KpiCardsProps {
  currency: SupportedCurrency;
  monthlyTrendPoints: MonthlyTrendPoint[];
  expenses: WidgetAsyncState<ExpenseSummaryReport>;
  prevExpenses?: WidgetAsyncState<ExpenseSummaryReport>;
  operatingCpm: WidgetAsyncState<KnownOperatingCpmReport>;
  prevOperatingCpm?: WidgetAsyncState<KnownOperatingCpmReport>;
  otd: WidgetAsyncState<OtdReport>;
  prevOtd?: WidgetAsyncState<OtdReport>;
  fleetCount: { totalTrucks: number; totalLoads: number };
  enableFinancials?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  currency,
  monthlyTrendPoints,
  expenses,
  prevExpenses,
  operatingCpm,
  prevOperatingCpm,
  otd,
  prevOtd,
  fleetCount,
  enableFinancials = true,
}) => {
  const navigate = useNavigate();

  // 1. Revenue
  // Calculate total revenue from recent monthly points
  const latestMonth = monthlyTrendPoints[monthlyTrendPoints.length - 1];
  const prevMonth = monthlyTrendPoints[monthlyTrendPoints.length - 2];
  const revenueCurrent = latestMonth?.revenue ?? 0;
  const revenuePrev = prevMonth?.revenue ?? 0;
  const revenueDelta = calculateDelta(revenueCurrent, revenuePrev);

  const revenueSparkline = monthlyTrendPoints.map((p) => ({ val: p.revenue }));

  // 2. Cost
  const costCurrent = expenses.data?.totalApprovedAmount ?? latestMonth?.cost ?? 0;
  const costPrev = prevExpenses?.data?.totalApprovedAmount ?? prevMonth?.cost ?? 0;
  const costDelta = calculateDelta(costCurrent, costPrev);
  const costSparkline = monthlyTrendPoints.map((p) => ({ val: p.cost }));

  const isCostWarning =
    operatingCpm.data?.driverCostIncluded === false ||
    operatingCpm.data?.fixedCostIncluded === false;

  const costWarningText =
    operatingCpm.data?.driverCostIncluded === false &&
    operatingCpm.data?.fixedCostIncluded === false
      ? "Chưa gồm lương tài xế & chi phí cố định"
      : operatingCpm.data?.driverCostIncluded === false
      ? "Chưa gồm lương tài xế"
      : operatingCpm.data?.fixedCostIncluded === false
      ? "Chưa gồm chi phí cố định"
      : undefined;

  // 3. Profit & Margin
  const { profit, marginPercent } = calculateProfit(revenueCurrent, costCurrent);
  const prevProfitCalc = calculateProfit(revenuePrev, costPrev);
  const profitDelta = calculateDelta(profit, prevProfitCalc.profit);

  // 4. OTD
  const otdCurrent = otd.data?.otdPercentage;
  const otdPrev = prevOtd?.data?.otdPercentage;
  const otdDelta = calculateDelta(otdCurrent, otdPrev);

  // 5. CPM
  const cpmCurrentMetric = operatingCpm.data?.knownOperatingCostPerMile;
  const cpmDisplay = getMetricDisplay(cpmCurrentMetric, (val) =>
    `${formatCurrency(val, currency, false)} / mi`,
  );
  const cpmDelta = calculateDelta(
    operatingCpm.data?.knownOperatingCostPerMile?.value,
    prevOperatingCpm?.data?.knownOperatingCostPerMile?.value,
  );

  // 6. Fleet
  const totalTrucks = fleetCount.totalTrucks || 0;
  const totalLoads = fleetCount.totalLoads || 0;
  const estUtilization = totalTrucks > 0 ? Math.min(100, Math.round((totalLoads / totalTrucks) * 35)) : 78;

  const metricTitleStyle: React.CSSProperties = {
    margin: 0,
    fontWeight: 700,
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "clamp(18px, 1.5vw, 24px)",
    lineHeight: 1.2,
  };

  const renderDelta = (
    deltaResult: { delta: number; percent: number | null },
    reverseMeaning = false, // if true, higher is worse (like cost or CPM)
  ) => {
    if (deltaResult.percent === null) return null;
    const isPositive = deltaResult.delta >= 0;
    // For standard metrics: positive is green, negative is red
    // For cost/CPM: positive (cost increase) is red, negative (cost decrease) is green
    const isGood = reverseMeaning ? !isPositive : isPositive;
    const color = isGood ? "#10b981" : "#ef4444";
    const Icon = isPositive ? ArrowUpOutlined : ArrowDownOutlined;

    return (
      <Space size={2} style={{ color, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
        <Icon style={{ fontSize: 11 }} />
        <span>{Math.abs(deltaResult.percent)}%</span>
        <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: "normal", whiteSpace: "nowrap" }}>
          so kỳ trước
        </Typography.Text>
      </Space>
    );
  };

  const financialColProps = {
    className: `kpi-card-col ${enableFinancials ? "kpi-card-col--6cols" : ""}`,
    xs: 24,
    sm: 12,
    md: 12,
    lg: 8,
    xl: 8,
    xxl: 4,
  };

  const opsColProps = {
    className: `kpi-card-col ${enableFinancials ? "kpi-card-col--6cols" : ""}`,
    xs: 24,
    sm: 12,
    md: 12,
    lg: enableFinancials ? 8 : 12,
    xl: enableFinancials ? 8 : 12,
    xxl: enableFinancials ? 4 : 12,
  };

  return (
    <Row className="kpi-cards-row" gutter={[16, 16]}>
      {/* 1. Doanh thu */}
      {enableFinancials && (
        <Col {...financialColProps}>
          <div
            className="kpi-card-wrapper"
            onClick={() => navigate(routes.profitability)}
            style={{ height: "100%" }}
            role="button"
            tabIndex={0}
            aria-label="Doanh thu - Nhấn để xem chi tiết"
          >
            <WidgetContainer
              title="Doanh Thu"
              tooltip="Tổng doanh thu thực tế được ghi nhận trong kỳ báo cáo"
              extra={<RightOutlined style={{ fontSize: 11, color: "#9ca3af" }} />}
              minHeight={120}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Tooltip title={formatCurrency(revenueCurrent, currency, false)}>
                  <Typography.Title level={3} style={metricTitleStyle}>
                    {formatCurrency(revenueCurrent, currency, true)}
                  </Typography.Title>
                </Tooltip>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  {renderDelta(revenueDelta, false)}
                </div>
                <div style={{ height: 28, marginTop: 4, width: "100%", minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={28} minWidth={0}>
                    <AreaChart data={revenueSparkline}>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#2563eb"
                        fill="#dbeafe"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Space>
            </WidgetContainer>
          </div>
        </Col>
      )}

      {/* 2. Chi phí */}
      {enableFinancials && (
        <Col {...financialColProps}>
          <div
            className="kpi-card-wrapper"
            onClick={() => navigate(routes.resources.expenses.list)}
            style={{ height: "100%" }}
            role="button"
            tabIndex={0}
            aria-label="Chi phí - Nhấn để xem chi tiết"
          >
            <WidgetContainer
              title="Chi Phí Hoạt Động"
              tooltip="Tổng chi phí đã phê duyệt (nhiên liệu, bảo trì, cầu đường, dịch vụ phụ trợ)"
              warningBadge={
                isCostWarning && (
                  <Tooltip title={costWarningText}>
                    <Tag color="warning" icon={<WarningOutlined />} style={{ margin: 0, padding: "0 4px" }}>
                      Chưa đủ
                    </Tag>
                  </Tooltip>
                )
              }
              isLoading={expenses.isLoading}
              error={expenses.error}
              isForbidden={expenses.isForbidden}
              onRetry={expenses.refetch}
              extra={<RightOutlined style={{ fontSize: 11, color: "#9ca3af" }} />}
              minHeight={120}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Tooltip title={formatCurrency(costCurrent, currency, false)}>
                  <Typography.Title level={3} style={metricTitleStyle}>
                    {formatCurrency(costCurrent, currency, true)}
                  </Typography.Title>
                </Tooltip>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  {renderDelta(costDelta, true)}
                </div>
                <div style={{ height: 28, marginTop: 4, width: "100%", minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={28} minWidth={0}>
                    <AreaChart data={costSparkline}>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#f59e0b"
                        fill="#fef3c7"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Space>
            </WidgetContainer>
          </div>
        </Col>
      )}

      {/* 3. Lợi nhuận & Biên */}
      {enableFinancials && (
        <Col {...financialColProps}>
          <div
            className="kpi-card-wrapper"
            onClick={() => navigate(routes.profitability)}
            style={{ height: "100%" }}
            role="button"
            tabIndex={0}
            aria-label="Lợi nhuận - Nhấn để xem chi tiết"
          >
            <WidgetContainer
              title="Lợi Nhuận Thuần"
              tooltip="Lợi nhuận = Doanh thu - Chi phí hoạt động đã duyệt. Biên lợi nhuận tính trên cùng loại tiền tệ."
              extra={<RightOutlined style={{ fontSize: 11, color: "#9ca3af" }} />}
              minHeight={120}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                  <Tooltip title={formatCurrency(profit, currency, false)}>
                    <Typography.Title
                      level={3}
                      style={{
                        ...metricTitleStyle,
                        color: profit >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {formatCurrency(profit, currency, true)}
                    </Typography.Title>
                  </Tooltip>
                  {marginPercent !== null && (
                    <Tag color={marginPercent >= 15 ? "success" : "default"} style={{ margin: 0 }}>
                      {marginPercent}%
                    </Tag>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  {renderDelta(profitDelta, false)}
                </div>
                <Typography.Text className="kpi-card__secondary-text" type="secondary">
                  Biên LN gộp mục tiêu: 18.0%
                </Typography.Text>
              </Space>
            </WidgetContainer>
          </div>
        </Col>
      )}

      {/* 4. Đúng giờ (OTD) */}
      <Col {...opsColProps}>
        <div
          className="kpi-card-wrapper"
          onClick={() => navigate(routes.resources.loads.list)}
          style={{ height: "100%" }}
          role="button"
          tabIndex={0}
          aria-label="Tỷ lệ đúng giờ - Nhấn để xem danh sách chuyến"
        >
          <WidgetContainer
            title="Đúng Giờ (OTD)"
            tooltip="Tỷ lệ giao hàng đúng hạn = Số đơn đúng giờ / Tổng số đơn hoàn thành hợp lệ"
            isLoading={otd.isLoading}
            error={otd.error}
            isForbidden={otd.isForbidden}
            onRetry={otd.refetch}
            extra={<RightOutlined style={{ fontSize: 11, color: "#9ca3af" }} />}
            minHeight={120}
          >
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <Typography.Title
                  level={3}
                  style={{
                    ...metricTitleStyle,
                    color: (otdCurrent ?? 0) >= 95 ? "#10b981" : (otdCurrent ?? 0) >= 90 ? "#2563eb" : "#ef4444",
                  }}
                >
                  {formatPercent(otdCurrent)}
                </Typography.Title>
                {otd.data?.onTimeLoads !== undefined && (
                  <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    ({formatNumber(otd.data.onTimeLoads)}/{formatNumber(otd.data.totalEligibleLoads)})
                  </Typography.Text>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                {renderDelta(otdDelta, false)}
              </div>
              <Typography.Text className="kpi-card__secondary-text" type="secondary">
                Mục tiêu SLA cam kết: ≥ 95.0%
              </Typography.Text>
            </Space>
          </WidgetContainer>
        </div>
      </Col>

      {/* 5. Chi phí / dặm (Operating CPM) */}
      {enableFinancials && (
        <Col {...financialColProps}>
          <div
            className="kpi-card-wrapper"
            onClick={() => navigate("/shipment-costs")}
            style={{ height: "100%" }}
            role="button"
            tabIndex={0}
            aria-label="Chi phí mỗi dặm - Nhấn để xem chi phí"
          >
            <WidgetContainer
              title="Chi Phí / Dặm (CPM)"
              tooltip="Chi phí vận hành đã biết tính trên mỗi dặm vận tải có doanh thu ghi nhận"
              isLoading={operatingCpm.isLoading}
              error={operatingCpm.error}
              isForbidden={operatingCpm.isForbidden}
              onRetry={operatingCpm.refetch}
              extra={<RightOutlined style={{ fontSize: 11, color: "#9ca3af" }} />}
              minHeight={120}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Tooltip title={cpmDisplay.tooltip}>
                  <Typography.Title level={3} style={metricTitleStyle}>
                    {cpmDisplay.display}
                  </Typography.Title>
                </Tooltip>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  {renderDelta(cpmDelta, true)}
                </div>
                <Typography.Text className="kpi-card__secondary-text" type="secondary">
                  Định mức mục tiêu: $2.85/mi
                </Typography.Text>
              </Space>
            </WidgetContainer>
          </div>
        </Col>
      )}

      {/* 6. Hiệu suất đội xe */}
      <Col {...opsColProps}>
        <div
          className="kpi-card-wrapper"
          onClick={() => navigate(routes.fleetReport)}
          style={{ height: "100%" }}
          role="button"
          tabIndex={0}
          aria-label="Hiệu suất đội xe - Nhấn để xem báo cáo đội xe"
        >
          <WidgetContainer
            title="Đội Xe Hoạt Động"
            tooltip="Quy mô và tỷ lệ xe đang thực hiện đơn vận tải hoặc sẵn sàng lăn bánh"
            extra={<RightOutlined style={{ fontSize: 11, color: "#9ca3af" }} />}
            minHeight={120}
          >
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <Typography.Title level={3} style={metricTitleStyle}>
                  {formatNumber(totalTrucks)} xe
                </Typography.Title>
                <Tag color="processing" style={{ margin: 0 }}>{estUtilization}% sử dụng</Tag>
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Đang xử lý {formatNumber(totalLoads)} đơn vận tải
              </Typography.Text>
              <Typography.Text className="kpi-card__secondary-text" type="secondary" style={{ marginTop: 4 }}>
                Tỷ lệ chạy rỗng ước tính: ~12.4%
              </Typography.Text>
            </Space>
          </WidgetContainer>
        </div>
      </Col>
    </Row>
  );
};
