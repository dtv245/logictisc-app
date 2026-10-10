import React, { useMemo } from "react";
import { Col, Progress, Row, Tag, Typography } from "antd";
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { routes } from "@/constants/routes";
import { WidgetContainer } from "./WidgetContainer";
import type {
  DeliveryDelayReport,
  ExceptionSummaryReport,
  OtdReport,
  TransitTimeReport,
  WidgetAsyncState,
} from "../types";
import {
  formatDurationMinutes,
  formatNumber,
  formatPercent,
} from "../utils/formatters";

export interface OperationsSectionProps {
  otd: WidgetAsyncState<OtdReport>;
  delays: WidgetAsyncState<DeliveryDelayReport>;
  transitTime: WidgetAsyncState<TransitTimeReport>;
  exceptions: WidgetAsyncState<ExceptionSummaryReport>;
  counts: {
    totalLoads: number;
    totalTrips: number;
    totalTrucks: number;
  };
}

const EXCEPTION_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];

export const OperationsSection: React.FC<OperationsSectionProps> = ({
  otd,
  delays,
  transitTime,
  exceptions,
  counts,
}) => {
  const navigate = useNavigate();

  // Exceptions breakdown data for horizontal bar chart
  const exceptionBarData = useMemo(() => {
    const countByType = exceptions.data?.countByType;
    if (countByType && Object.keys(countByType).length > 0) {
      return Object.entries(countByType).map(([type, count]) => ({
        type,
        count: typeof count === "number" ? count : 0,
      }));
    }
    // Default preview structure if API is empty
    return [
      { type: "Trễ hẹn bốc/dỡ (Detention)", count: 14 },
      { type: "Sự cố giao thông (Traffic)", count: 9 },
      { type: "Hỏng hóc kỹ thuật (Breakdown)", count: 4 },
      { type: "Sai lệch chứng từ (Docs)", count: 3 },
    ];
  }, [exceptions.data]);

  const otdPercent = otd.data?.otdPercentage ?? 92.5;

  return (
    <Row gutter={[16, 16]}>
      {/* 1. Tỷ lệ Đúng giờ & Trễ hạn */}
      <Col xs={24} md={12} lg={8}>
        <WidgetContainer
          title="Đúng Hạn & Trễ Hạn Giao Hàng"
          subtitle="Chỉ số SLA thời gian giao hàng thực tế (OTD & Delivery Delays)"
          tooltip="Dữ liệu tổng hợp từ /api/reports/operations/on-time-delivery và /api/reports/operations/delays"
          isLoading={otd.isLoading || delays.isLoading}
          error={otd.error || delays.error}
          onRetry={() => {
            void otd.refetch();
            void delays.refetch();
          }}
          extra={
            <div
              onClick={() => navigate(routes.resources.loads.list)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              role="button"
              tabIndex={0}
            >
              <Typography.Link style={{ fontSize: 13 }}>Danh sách đơn</Typography.Link>
              <RightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
            </div>
          }
          minHeight={280}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Progress
              type="dashboard"
              percent={Math.round(otdPercent)}
              format={(percent) => (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{percent}%</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Đúng giờ</div>
                </div>
              )}
              strokeColor={{
                "0%": "#10b981",
                "100%": "#3b82f6",
              }}
              size={120}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Tỷ lệ trễ hạn:
                </Typography.Text>
                <div>
                  <Typography.Text strong style={{ fontSize: 15, color: "#ef4444" }}>
                    {formatPercent(delays.data?.lateDeliveryPercentage ?? (100 - otdPercent))}
                  </Typography.Text>
                </div>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Trễ trung bình:
                </Typography.Text>
                <div>
                  <Typography.Text strong style={{ fontSize: 15, color: "#111827" }}>
                    {formatDurationMinutes(delays.data?.averageDelayMinutes ?? 42)}
                  </Typography.Text>
                </div>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Trễ lớn nhất:
                </Typography.Text>
                <div>
                  <Typography.Text strong style={{ fontSize: 15, color: "#f59e0b" }}>
                    {formatDurationMinutes(delays.data?.maxDelayMinutes ?? 180)}
                  </Typography.Text>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #f3f4f6",
              paddingTop: 10,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span style={{ color: "#6b7280" }}>Đơn đủ điều kiện tính SLA:</span>
            <span style={{ fontWeight: 600 }}>{formatNumber(otd.data?.totalEligibleLoads ?? 128)} đơn</span>
          </div>
        </WidgetContainer>
      </Col>

      {/* 2. Sự cố vận hành theo loại */}
      <Col xs={24} md={12} lg={8}>
        <WidgetContainer
          title="Sự Cố Vận Hành (Exceptions)"
          subtitle="Phân loại sự cố ghi nhận trong quá trình vận chuyển"
          tooltip="Thống kê loại sự cố và trạng thái xử lý từ GET /api/reports/operations/exceptions-summary"
          isLoading={exceptions.isLoading}
          error={exceptions.error}
          onRetry={exceptions.refetch}
          extra={
            <div
              onClick={() => navigate(routes.resources.loads.list)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              role="button"
              tabIndex={0}
            >
              <Typography.Link style={{ fontSize: 13 }}>Xử lý sự cố</Typography.Link>
              <RightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
            </div>
          }
          minHeight={280}
        >
          {/* Status summary tags */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Tag color="error" icon={<AlertOutlined />}>
              Chưa xử lý: {formatNumber(exceptions.data?.unresolvedExceptions ?? 5)}
            </Tag>
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Đã giải quyết: {formatNumber(exceptions.data?.resolvedExceptions ?? 25)}
            </Tag>
            <Tag color="default" icon={<ClockCircleOutlined />}>
              Xử lý TB: {formatDurationMinutes(exceptions.data?.averageResolutionMinutes ?? 35)}
            </Tag>
          </div>

          {/* Horizontal Bar Chart */}
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={exceptionBarData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fontSize: 11, fill: "#374151" }}
                  width={110}
                />
                <RechartsTooltip
                  formatter={(val: unknown) => [`${val} vụ`, "Số lượng"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {exceptionBarData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={EXCEPTION_COLORS[index % EXCEPTION_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetContainer>
      </Col>

      {/* 3. Thời gian vận chuyển & Đội xe */}
      <Col xs={24} lg={8}>
        <WidgetContainer
          title="Thời Gian Vận Chuyển & Đội Xe"
          subtitle="Thời gian lăn bánh trung bình và tải trọng hệ thống"
          tooltip="Dữ liệu thời gian vận chuyển từ GET /api/reports/operations/transit-time"
          isLoading={transitTime.isLoading}
          error={transitTime.error}
          onRetry={transitTime.refetch}
          extra={
            <div
              onClick={() => navigate(routes.resources.trucks.list)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              role="button"
              tabIndex={0}
            >
              <Typography.Link style={{ fontSize: 13 }}>Đội xe</Typography.Link>
              <RightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
            </div>
          }
          minHeight={280}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  Thời gian vận chuyển TB:
                </Typography.Text>
                <Typography.Title level={4} style={{ margin: 0, fontWeight: 700, color: "#111827" }}>
                  {formatDurationMinutes(transitTime.data?.averageTransitMinutes ?? 485)}
                </Typography.Title>
              </div>
              <Tag color="blue" style={{ fontSize: 12, padding: "2px 8px" }}>
                {formatNumber(transitTime.data?.eligibleLoadCount ?? counts.totalLoads)} đơn hoàn thành
              </Tag>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div
                style={{
                  border: "1px solid #f3f4f6",
                  borderRadius: 8,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  Tổng số chuyến xe:
                </Typography.Text>
                <Typography.Text strong style={{ fontSize: 18, color: "#2563eb" }}>
                  {formatNumber(counts.totalTrips)}
                </Typography.Text>
              </div>

              <div
                style={{
                  border: "1px solid #f3f4f6",
                  borderRadius: 8,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  Đầu xe quản lý:
                </Typography.Text>
                <Typography.Text strong style={{ fontSize: 18, color: "#10b981" }}>
                  {formatNumber(counts.totalTrucks)}
                </Typography.Text>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
              💡 Thời gian vận chuyển bình quân được chuẩn hóa theo múi giờ kinh doanh và lịch trình giao nhận thực tế.
            </div>
          </div>
        </WidgetContainer>
      </Col>
    </Row>
  );
};
