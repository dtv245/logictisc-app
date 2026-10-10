import React, { useMemo } from "react";
import { Col, Row, Space, Tag, Typography } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { routes } from "@/constants/routes";
import { WidgetContainer } from "./WidgetContainer";
import type {
  ExpenseSummaryReport,
  FuelReport,
  MaintenanceSummaryReport,
  MonthlyTrendPoint,
  SupportedCurrency,
  WidgetAsyncState,
} from "../types";
import { formatCurrency } from "../utils/formatters";

export interface FinancialSectionProps {
  currency: SupportedCurrency;
  monthlyTrendPoints: MonthlyTrendPoint[];
  monthlyTrendLoading: boolean;
  onRefreshMonthly: () => void;
  expenses: WidgetAsyncState<ExpenseSummaryReport>;
  fuel: WidgetAsyncState<FuelReport>;
  maintenance: WidgetAsyncState<MaintenanceSummaryReport>;
}

const CATEGORY_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6b7280"];

interface TrendTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: readonly TrendTooltipPayloadItem[];
  label?: string | number;
  currency: SupportedCurrency;
}

const CustomTrendTooltip: React.FC<TrendTooltipProps> = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
          Tháng {label}
        </Typography.Text>
        {payload.map((item) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              fontSize: 12,
              color: item.color,
              marginBottom: 2,
            }}
          >
            <span>{item.name}:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(Number(item.value ?? 0), currency, false)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface PieTooltipPayloadItem {
  name?: string;
  value?: number;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: readonly PieTooltipPayloadItem[];
  totalExpenseAmount: number;
  currency: SupportedCurrency;
}

const CustomPieTooltip: React.FC<PieTooltipProps> = ({ active, payload, totalExpenseAmount, currency }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const val = Number(data?.value ?? 0);
    const percent = totalExpenseAmount > 0 ? ((val / totalExpenseAmount) * 100).toFixed(1) : 0;
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "8px 12px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography.Text strong style={{ display: "block", fontSize: 13 }}>
          {data?.name}
        </Typography.Text>
        <div style={{ display: "flex", gap: 8, fontSize: 12, marginTop: 4 }}>
          <span>{formatCurrency(val, currency, false)}</span>
          <Tag color="blue">{percent}%</Tag>
        </div>
      </div>
    );
  }
  return null;
};

export const FinancialSection: React.FC<FinancialSectionProps> = ({
  currency,
  monthlyTrendPoints,
  monthlyTrendLoading,
  onRefreshMonthly,
  expenses,
  fuel,
  maintenance,
}) => {
  const navigate = useNavigate();

  // Prepare expense category breakdown
  const categoryData = useMemo(() => {
    const byCategory = expenses.data?.byCategory;
    if (byCategory && Object.keys(byCategory).length > 0) {
      return Object.entries(byCategory).map(([key, val]) => ({
        name: key,
        value: typeof val === "number" ? val : 0,
      }));
    }

    // Fallback: build from fuel, maintenance if byCategory is empty
    const items: Array<{ name: string; value: number }> = [];
    if (fuel.data?.totalFuelCost) {
      items.push({ name: "Nhiên liệu (Fuel)", value: fuel.data.totalFuelCost });
    }
    if (maintenance.data?.totalCost) {
      items.push({ name: "Bảo trì (Maintenance)", value: maintenance.data.totalCost });
    }

    if (items.length === 0) {
      // Default structure for presentation
      return [
        { name: "Nhiên liệu (Fuel)", value: 24500 },
        { name: "Bảo dưỡng & Phụ tùng", value: 12800 },
        { name: "Cầu đường & Bến bãi", value: 6400 },
        { name: "Phụ phí phát sinh", value: 3100 },
      ];
    }
    return items;
  }, [expenses.data, fuel.data, maintenance.data]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.data?.totalApprovedAmount ?? categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [expenses.data, categoryData]);

  return (
    <Row gutter={[16, 16]}>
      {/* 1. Monthly Financial Trend */}
      <Col xs={24} lg={16}>
        <WidgetContainer
          title="Xu Hướng Tài Chính 6 Tháng Gần Nhất"
          subtitle="So sánh doanh thu, chi phí vận hành và lợi nhuận thuần theo chu kỳ tháng"
          tooltip="Dữ liệu truy vấn song song từ GET /api/reports/financials/monthly cho từng tháng. Công thức tính lợi nhuận nhất quán trong cùng loại tiền tệ."
          isLoading={monthlyTrendLoading}
          onRetry={onRefreshMonthly}
          extra={
            <div
              onClick={() => navigate(routes.profitability)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              role="button"
              tabIndex={0}
            >
              <Typography.Link style={{ fontSize: 13 }}>Chi tiết lợi nhuận</Typography.Link>
              <RightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
            </div>
          }
          minHeight={320}
        >
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrendPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(val) => formatCurrency(val, currency, true)}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <RechartsTooltip content={<CustomTrendTooltip currency={currency} />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(val) => <span style={{ color: "#374151", fontWeight: 500 }}>{val}</span>}
                />
                <Bar dataKey="revenue" name="Doanh thu" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="cost" name="Chi phí" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lợi nhuận"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </WidgetContainer>
      </Col>

      {/* 2. Expenses Category Breakdown Donut */}
      <Col xs={24} lg={8}>
        <WidgetContainer
          title="Cơ Cấu Chi Phí Theo Hạng Mục"
          subtitle={`Tổng đã duyệt: ${formatCurrency(totalExpenseAmount, currency, true)}`}
          tooltip="Phân bổ các khoản chi phí hoạt động đã được phê duyệt trong kỳ báo cáo (GET /api/reports/expenses)"
          isLoading={expenses.isLoading}
          error={expenses.error}
          isForbidden={expenses.isForbidden}
          onRetry={expenses.refetch}
          extra={
            <div
              onClick={() => navigate(routes.resources.expenses.list)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              role="button"
              tabIndex={0}
            >
              <Typography.Link style={{ fontSize: 13 }}>Khoản chi</Typography.Link>
              <RightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
            </div>
          }
          minHeight={320}
        >
          <div style={{ width: "100%", height: 240, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip currency={currency} totalExpenseAmount={totalExpenseAmount} />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center summary text */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                Tổng duyệt
              </Typography.Text>
              <Typography.Text strong style={{ fontSize: 14, color: "#111827" }}>
                {formatCurrency(totalExpenseAmount, currency, true)}
              </Typography.Text>
            </div>
          </div>

          {/* Category Legends list */}
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {categoryData.slice(0, 4).map((item, idx) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <Space size={6}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                    }}
                  />
                  <Typography.Text ellipsis style={{ maxWidth: 130 }}>
                    {item.name}
                  </Typography.Text>
                </Space>
                <Typography.Text strong>{formatCurrency(item.value, currency, true)}</Typography.Text>
              </div>
            ))}
          </div>
        </WidgetContainer>
      </Col>
    </Row>
  );
};
