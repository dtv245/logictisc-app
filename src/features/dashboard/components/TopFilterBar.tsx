import React, { useMemo } from "react";
import {
  Button,
  DatePicker,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import type {
  DashboardFilters,
  DatePreset,
  SupportedCurrency,
} from "../types";
import { CURRENCY_OPTIONS } from "../config/rankingWeights";

const { RangePicker } = DatePicker;

export interface TopFilterBarProps {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  onRefresh: () => void;
  onExportCsv?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  title?: string;
  subtitle?: string;
}

export const TopFilterBar: React.FC<TopFilterBarProps> = ({
  filters,
  onChange,
  onRefresh,
  onExportCsv,
  isRefreshing = false,
  lastUpdated = new Date(),
  title = "Điều Phối Vận Hành",
  subtitle = "Giám sát hiệu suất thời gian thực, tài chính và đội xe",
}) => {
  // Preset change handler
  const handlePresetChange = (preset: DatePreset) => {
    const today = dayjs();
    let from = today.subtract(30, "day").format("YYYY-MM-DD");
    let to = today.format("YYYY-MM-DD");

    switch (preset) {
      case "today":
        from = today.format("YYYY-MM-DD");
        to = today.format("YYYY-MM-DD");
        break;
      case "7d":
        from = today.subtract(7, "day").format("YYYY-MM-DD");
        to = today.format("YYYY-MM-DD");
        break;
      case "30d":
        from = today.subtract(30, "day").format("YYYY-MM-DD");
        to = today.format("YYYY-MM-DD");
        break;
      case "this_month":
        from = today.startOf("month").format("YYYY-MM-DD");
        to = today.format("YYYY-MM-DD");
        break;
      case "custom":
        // Keep existing from/to
        from = filters.from || today.subtract(30, "day").format("YYYY-MM-DD");
        to = filters.to || today.format("YYYY-MM-DD");
        break;
    }

    onChange({
      ...filters,
      preset,
      from,
      to,
    });
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onChange({
        ...filters,
        preset: "custom",
        from: dates[0].format("YYYY-MM-DD"),
        to: dates[1].format("YYYY-MM-DD"),
      });
    }
  };

  const rangeValue = useMemo<[Dayjs, Dayjs] | null>(() => {
    if (filters.from && filters.to) {
      return [dayjs(filters.from), dayjs(filters.to)];
    }
    return null;
  }, [filters.from, filters.to]);

  const formattedTime = useMemo(() => {
    return dayjs(lastUpdated).format("HH:mm:ss");
  }, [lastUpdated]);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 24px",
        marginBottom: 16,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Title and last updated */}
        <div>
          <Space align="center" size={8}>
            <Typography.Title
              level={4}
              style={{ margin: 0, color: "#111827", fontWeight: 700 }}
            >
              {title}
            </Typography.Title>
            <Tag icon={<ClockCircleOutlined />} color="default">
              Cập nhật {formattedTime}
            </Tag>
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 13, display: "block" }}>
            {subtitle}
          </Typography.Text>
        </div>

        {/* Global Controls & Filters */}
        <Space wrap size={12} align="center">
          {/* Date presets */}
          <Radio.Group
            value={filters.preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="today">Hôm nay</Radio.Button>
            <Radio.Button value="7d">7 ngày</Radio.Button>
            <Radio.Button value="30d">30 ngày</Radio.Button>
            <Radio.Button value="this_month">Tháng này</Radio.Button>
            <Radio.Button value="custom">Tuỳ chọn</Radio.Button>
          </Radio.Group>

          {/* Date Range Picker */}
          <RangePicker
            value={rangeValue}
            onChange={handleRangeChange}
            allowClear={false}
            disabled={filters.preset !== "custom"}
            style={{ width: 240 }}
          />

          {/* Currency Selector */}
          <Select<SupportedCurrency>
            value={filters.currency}
            onChange={(currency) => onChange({ ...filters, currency })}
            options={CURRENCY_OPTIONS}
            style={{ width: 110 }}
          />

          {/* Compare Previous Period */}
          <Space size={6} align="center">
            <Typography.Text style={{ fontSize: 13 }}>So sánh kỳ trước:</Typography.Text>
            <Switch
              checked={filters.comparePrevious}
              onChange={(checked) => onChange({ ...filters, comparePrevious: checked })}
            />
          </Space>

          {/* Refresh button */}
          <Button
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={onRefresh}
            loading={isRefreshing}
          >
            Làm mới
          </Button>

          {/* Export CSV button */}
          {onExportCsv && (
            <Button icon={<DownloadOutlined />} onClick={onExportCsv}>
              Xuất CSV
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};
