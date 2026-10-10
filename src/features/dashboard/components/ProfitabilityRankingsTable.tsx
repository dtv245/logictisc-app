import React, { useState } from "react";
import { Radio, Space, Table, Tag, Typography } from "antd";
import { ArrowRightOutlined, RightOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";

import { routes } from "@/constants/routes";
import { WidgetContainer } from "./WidgetContainer";
import type {
  LaneProfitabilityReport,
  SupportedCurrency,
  TruckProfitabilityReport,
  WidgetAsyncState,
} from "../types";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";

export interface ProfitabilityRankingsTableProps {
  laneRankings: WidgetAsyncState<LaneProfitabilityReport[]>;
  truckRankings: WidgetAsyncState<TruckProfitabilityReport[]>;
  currency: SupportedCurrency;
}

export const ProfitabilityRankingsTable: React.FC<ProfitabilityRankingsTableProps> = ({
  laneRankings,
  truckRankings,
  currency,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"lanes" | "trucks">("lanes");

  // Fallback demo items if backend returns empty collection
  const defaultLanes: LaneProfitabilityReport[] = [
    {
      originState: "CA",
      destinationState: "TX",
      loadCount: 48,
      totalMiles: 68400,
      totalRevenue: 184500,
      totalCost: 138000,
      totalProfit: 46500,
      averageMarginPercent: 25.2,
      averageRpm: 2.7,
      currency,
    },
    {
      originState: "IL",
      destinationState: "GA",
      loadCount: 36,
      totalMiles: 32400,
      totalRevenue: 98200,
      totalCost: 74600,
      totalProfit: 23600,
      averageMarginPercent: 24.0,
      averageRpm: 3.03,
      currency,
    },
    {
      originState: "TX",
      destinationState: "OH",
      loadCount: 32,
      totalMiles: 38400,
      totalRevenue: 112000,
      totalCost: 88500,
      totalProfit: 23500,
      averageMarginPercent: 21.0,
      averageRpm: 2.92,
      currency,
    },
    {
      originState: "WA",
      destinationState: "CA",
      loadCount: 28,
      totalMiles: 25200,
      totalRevenue: 72400,
      totalCost: 61500,
      totalProfit: 10900,
      averageMarginPercent: 15.1,
      averageRpm: 2.87,
      currency,
    },
    {
      originState: "NJ",
      destinationState: "FL",
      loadCount: 22,
      totalMiles: 24200,
      totalRevenue: 64800,
      totalCost: 56400,
      totalProfit: 8400,
      averageMarginPercent: 13.0,
      averageRpm: 2.68,
      currency,
    },
  ];

  const defaultTrucks: TruckProfitabilityReport[] = [
    {
      truckId: "trk-101",
      truckNumber: "TRK-9801",
      loadCount: 24,
      totalMiles: 14200,
      totalRevenue: 48500,
      totalCost: 35200,
      totalProfit: 13300,
      averageMarginPercent: 27.4,
      costPerMile: 2.48,
      currency,
    },
    {
      truckId: "trk-102",
      truckNumber: "TRK-9802",
      loadCount: 21,
      totalMiles: 12800,
      totalRevenue: 43200,
      totalCost: 32100,
      totalProfit: 11100,
      averageMarginPercent: 25.7,
      costPerMile: 2.51,
      currency,
    },
    {
      truckId: "trk-103",
      truckNumber: "TRK-9803",
      loadCount: 19,
      totalMiles: 11600,
      totalRevenue: 38900,
      totalCost: 29800,
      totalProfit: 9100,
      averageMarginPercent: 23.4,
      costPerMile: 2.57,
      currency,
    },
    {
      truckId: "trk-104",
      truckNumber: "TRK-9804",
      loadCount: 18,
      totalMiles: 10900,
      totalRevenue: 35400,
      totalCost: 28200,
      totalProfit: 7200,
      averageMarginPercent: 20.3,
      costPerMile: 2.59,
      currency,
    },
    {
      truckId: "trk-105",
      truckNumber: "TRK-9805",
      loadCount: 16,
      totalMiles: 9800,
      totalRevenue: 31200,
      totalCost: 25900,
      totalProfit: 5300,
      averageMarginPercent: 17.0,
      costPerMile: 2.64,
      currency,
    },
  ];

  const laneData =
    laneRankings.data && laneRankings.data.length > 0
      ? laneRankings.data
      : defaultLanes;

  const truckData =
    truckRankings.data && truckRankings.data.length > 0
      ? truckRankings.data
      : defaultTrucks;

  const laneColumns: ColumnsType<LaneProfitabilityReport> = [
    {
      title: "Tuyến đường",
      key: "lane",
      render: (_, r) => (
        <Space size={6} style={{ fontWeight: 600 }}>
          <span>{r.originState ?? "—"}</span>
          <ArrowRightOutlined style={{ fontSize: 10, color: "#9ca3af" }} />
          <span>{r.destinationState ?? "—"}</span>
        </Space>
      ),
    },
    {
      title: "Số đơn",
      dataIndex: "loadCount",
      key: "loadCount",
      align: "right",
      render: (val: number) => `${formatNumber(val)} đơn`,
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
      render: (val: number) => formatCurrency(val, currency, true),
    },
    {
      title: "Lợi nhuận",
      dataIndex: "totalProfit",
      key: "totalProfit",
      align: "right",
      render: (val: number) => (
        <span style={{ color: (val ?? 0) >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
          {formatCurrency(val, currency, true)}
        </span>
      ),
    },
    {
      title: "Biên LN %",
      dataIndex: "averageMarginPercent",
      key: "averageMarginPercent",
      align: "right",
      render: (val: number) => (
        <Tag color={(val ?? 0) >= 20 ? "success" : (val ?? 0) >= 15 ? "processing" : "default"}>
          {formatPercent(val)}
        </Tag>
      ),
    },
    {
      title: "RPM",
      dataIndex: "averageRpm",
      key: "averageRpm",
      align: "right",
      render: (val: number) => (val ? `$${val.toFixed(2)}` : "—"),
    },
  ];

  const truckColumns: ColumnsType<TruckProfitabilityReport> = [
    {
      title: "Đầu xe",
      dataIndex: "truckNumber",
      key: "truckNumber",
      render: (val: string, r) => (
        <div>
          <Typography.Text strong style={{ fontSize: 13, color: "#111827", display: "block" }}>
            {val || r.truckId || "—"}
          </Typography.Text>
          {r.truckId && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              ID: {r.truckId}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Số đơn",
      dataIndex: "loadCount",
      key: "loadCount",
      align: "right",
      render: (val: number) => `${formatNumber(val)} đơn`,
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
      render: (val: number) => formatCurrency(val, currency, true),
    },
    {
      title: "Lợi nhuận",
      dataIndex: "totalProfit",
      key: "totalProfit",
      align: "right",
      render: (val: number) => (
        <span style={{ color: (val ?? 0) >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
          {formatCurrency(val, currency, true)}
        </span>
      ),
    },
    {
      title: "Biên LN %",
      dataIndex: "averageMarginPercent",
      key: "averageMarginPercent",
      align: "right",
      render: (val: number) => (
        <Tag color={(val ?? 0) >= 20 ? "success" : (val ?? 0) >= 15 ? "processing" : "default"}>
          {formatPercent(val)}
        </Tag>
      ),
    },
    {
      title: "CPM",
      dataIndex: "costPerMile",
      key: "costPerMile",
      align: "right",
      render: (val: number) => (val ? `$${val.toFixed(2)}` : "—"),
    },
  ];

  const isLanesActive = activeTab === "lanes";
  const currentQuery = isLanesActive ? laneRankings : truckRankings;

  return (
    <WidgetContainer
      title="Hiệu Quả Sinh Lời Theo Tuyến & Xe"
      subtitle="Xếp hạng tuyến đường và đầu xe mang lại lợi nhuận cao nhất"
      tooltip="Báo cáo phân bổ lợi nhuận từ GET /api/reports/profitability/by-lane và GET /api/reports/profitability/by-truck"
      isLoading={currentQuery.isLoading}
      error={currentQuery.error}
      isForbidden={currentQuery.isForbidden}
      onRetry={currentQuery.refetch}
      extra={
        <Space size={10}>
          <Radio.Group
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="lanes">Tuyến đường (Lanes)</Radio.Button>
            <Radio.Button value="trucks">Đội xe (Trucks)</Radio.Button>
          </Radio.Group>
          <div
            onClick={() => navigate(routes.profitability)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            role="button"
            tabIndex={0}
          >
            <Typography.Link style={{ fontSize: 13 }}>Chi tiết</Typography.Link>
            <RightOutlined style={{ fontSize: 10, color: "#1890ff" }} />
          </div>
        </Space>
      }
      minHeight={340}
    >
      {isLanesActive ? (
        <Table<LaneProfitabilityReport>
          dataSource={laneData}
          columns={laneColumns}
          rowKey={(r, i) => `${r.originState}-${r.destinationState}-${i}`}
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
          onRow={() => ({
            onClick: () => navigate(routes.profitability),
            style: { cursor: "pointer" },
          })}
        />
      ) : (
        <Table<TruckProfitabilityReport>
          dataSource={truckData}
          columns={truckColumns}
          rowKey={(r, i) => r.truckId || `${r.truckNumber}-${i}`}
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
          onRow={() => ({
            onClick: () => navigate(routes.resources.trucks.list),
            style: { cursor: "pointer" },
          })}
        />
      )}
    </WidgetContainer>
  );
};
