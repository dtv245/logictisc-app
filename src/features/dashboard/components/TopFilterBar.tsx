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

import "./TopFilterBar.scss";

const { RangePicker } = DatePicker;

const DATE_PRESET_OPTIONS: Array<{ label: string; value: DatePreset }> = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "Tháng này", value: "this_month" },
  { label: "Tuỳ chọn", value: "custom" },
];

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
    <div className="top-filter-bar">
      <div className="top-filter-bar__container">
        {/* Title and last updated */}
        <div className="top-filter-bar__header">
          <Space align="center" size={8} wrap>
            <Typography.Title level={4} className="top-filter-bar__title">
              {title}
            </Typography.Title>
            <Tag icon={<ClockCircleOutlined />} color="default">
              Cập nhật {formattedTime}
            </Tag>
          </Space>
          <Typography.Text className="top-filter-bar__subtitle" type="secondary">
            {subtitle}
          </Typography.Text>
        </div>

        {/* Global Controls & Filters */}
        <div className="top-filter-bar__controls">
          {/* Mobile Select */}
          <div className="top-filter-bar__preset-select-wrapper">
            <Select<DatePreset>
              value={filters.preset}
              onChange={handlePresetChange}
              options={DATE_PRESET_OPTIONS}
              style={{ width: "100%" }}
              aria-label="Chọn nhanh mốc ngày"
            />
          </div>

          {/* Desktop/Tablet Date presets with intentional horizontal scroll */}
          <div className="top-filter-bar__preset-radio-wrapper top-filter-bar__presets-container" role="region" aria-label="Chọn nhanh mốc ngày">
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
          </div>

          {/* Date Range Picker */}
          <RangePicker
            className="top-filter-bar__range-picker"
            value={rangeValue}
            onChange={handleRangeChange}
            allowClear={false}
            disabled={filters.preset !== "custom"}
          />

          {/* Currency Selector */}
          <Select<SupportedCurrency>
            className="top-filter-bar__currency-select top-filter-bar__currency"
            value={filters.currency}
            onChange={(currency) => onChange({ ...filters, currency })}
            options={CURRENCY_OPTIONS}
            aria-label="Chọn loại tiền tệ"
          />

          {/* Compare Previous Period */}
          <div className="top-filter-bar__compare-switch">
            <Typography.Text style={{ fontSize: 13, whiteSpace: "nowrap" }}>So sánh:</Typography.Text>
            <Switch
              checked={filters.comparePrevious}
              onChange={(checked) => onChange({ ...filters, comparePrevious: checked })}
            />
          </div>

          {/* Actions: Refresh & Export */}
          <div className="top-filter-bar__actions">
            <Button
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={onRefresh}
              loading={isRefreshing}
            >
              Làm mới
            </Button>

            {onExportCsv && (
              <Button icon={<DownloadOutlined />} onClick={onExportCsv}>
                Xuất CSV
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
