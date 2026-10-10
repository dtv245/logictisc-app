import React from "react";
import {
  Avatar,
  Button,
  Progress,
  Radio,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  InfoCircleOutlined,
  RightOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";

import { routes } from "@/constants/routes";
import { WidgetContainer } from "./WidgetContainer";
import type {
  DriverRankingItem,
  DriverRankingSortBy,
  SupportedCurrency,
  WidgetError,
} from "../types";
import { RANKING_FORMULA_EXPLANATION } from "../config/rankingWeights";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";

export interface DriverRankingTableProps {
  drivers: DriverRankingItem[];
  isLoading: boolean;
  isMock: boolean;
  sortBy: DriverRankingSortBy;
  onSortChange: (sortBy: DriverRankingSortBy) => void;
  currency: SupportedCurrency;
  onRetry?: () => void;
  error?: WidgetError | null;
}

export const DriverRankingTable: React.FC<DriverRankingTableProps> = ({
  drivers,
  isLoading,
  isMock,
  sortBy,
  onSortChange,
  currency,
  onRetry,
  error,
}) => {
  const navigate = useNavigate();

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span style={{ fontSize: 18 }} title="Hạng 1 - Huy chương Vàng">
            🥇
          </span>
        );
      case 2:
        return (
          <span style={{ fontSize: 18 }} title="Hạng 2 - Huy chương Bạc">
            🥈
          </span>
        );
      case 3:
        return (
          <span style={{ fontSize: 18 }} title="Hạng 3 - Huy chương Đồng">
            🥉
          </span>
        );
      default:
        return (
          <span
            style={{
              display: "inline-block",
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              textAlign: "center",
              lineHeight: "22px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {rank}
          </span>
        );
    }
  };

  const columns: ColumnsType<DriverRankingItem> = [
    {
      title: "Hạng",
      key: "rank",
      width: 65,
      align: "center",
      render: (_, record) => getRankBadge(record.rank),
    },
    {
      title: "Tài xế",
      key: "driverName",
      render: (_, record) => (
        <Space size={10}>
          <Avatar
            style={{ backgroundColor: record.rank <= 3 ? "#1890ff" : "#9ca3af" }}
            icon={<UserOutlined />}
            size="small"
          >
            {record.driverName.charAt(0)}
          </Avatar>
          <div>
            <Typography.Text strong style={{ fontSize: 13, color: "#111827", display: "block" }}>
              {record.driverName}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              ID: {record.driverId}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: (
        <Tooltip title={RANKING_FORMULA_EXPLANATION}>
          <Space size={4}>
            <span>Điểm tổng hợp</span>
            <InfoCircleOutlined style={{ fontSize: 11, color: "#9ca3af" }} />
          </Space>
        </Tooltip>
      ),
      dataIndex: "score",
      key: "score",
      width: 140,
      render: (score: number) => (
        <div style={{ width: 110 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>{score}</span>
            <span style={{ color: "#9ca3af" }}>/100</span>
          </div>
          <Progress
            percent={score}
            showInfo={false}
            size="small"
            strokeColor={score >= 90 ? "#10b981" : score >= 80 ? "#3b82f6" : "#f59e0b"}
          />
        </div>
      ),
    },
    {
      title: "Hoàn thành",
      dataIndex: "completedLoads",
      key: "completedLoads",
      align: "right",
      render: (val: number) => `${formatNumber(val)} đơn`,
    },
    {
      title: "Tổng dặm",
      dataIndex: "totalMiles",
      key: "totalMiles",
      align: "right",
      render: (val: number) => `${formatNumber(val)} mi`,
    },
    {
      title: "Đúng giờ",
      dataIndex: "onTimePercent",
      key: "onTimePercent",
      align: "right",
      render: (val: number) => (
        <Tag color={val >= 95 ? "success" : val >= 90 ? "processing" : "warning"} style={{ margin: 0 }}>
          {formatPercent(val)}
        </Tag>
      ),
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (val: number) => formatCurrency(val, currency, true),
    },
    {
      title: "RPM",
      dataIndex: "revenuePerMile",
      key: "revenuePerMile",
      align: "right",
      render: (val: number) => `$${val.toFixed(2)}`,
    },
  ];

  return (
    <WidgetContainer
      title={
        <Space size={8}>
          <TrophyOutlined style={{ color: "#f59e0b" }} />
          <span>Bảng Xếp Hạng Hiệu Suất Tài Xế (Top 10)</span>
          {isMock && (
            <Tooltip title="Chưa có endpoint GET /api/reports/drivers/ranking tại backend; UI đang sử dụng adapter dữ liệu mẫu theo đề xuất hợp đồng API.">
              <Tag color="orange" style={{ margin: 0 }}>
                Dữ liệu mẫu
              </Tag>
            </Tooltip>
          )}
        </Space>
      }
      subtitle="Đánh giá năng suất, tỷ lệ đúng giờ và đóng góp doanh thu của đội ngũ tài xế"
      tooltip={RANKING_FORMULA_EXPLANATION}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      extra={
        <Space wrap size={10}>
          <Radio.Group
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="score">Điểm tổng hợp</Radio.Button>
            <Radio.Button value="revenue">Doanh thu</Radio.Button>
            <Radio.Button value="totalMiles">Dặm</Radio.Button>
            <Radio.Button value="onTimePercent">Đúng giờ</Radio.Button>
          </Radio.Group>

          <Button
            type="link"
            size="small"
            onClick={() => navigate(routes.resources.employees.list)}
            style={{ padding: 0 }}
          >
            Tất cả tài xế <RightOutlined style={{ fontSize: 10 }} />
          </Button>
        </Space>
      }
      minHeight={340}
    >
      <Table<DriverRankingItem>
        dataSource={drivers}
        columns={columns}
        rowKey="driverId"
        pagination={false}
        size="small"
        scroll={{ x: 720 }}
        onRow={() => ({
          onClick: () => navigate(routes.resources.employees.list),
          style: { cursor: "pointer" },
        })}
      />
    </WidgetContainer>
  );
};
