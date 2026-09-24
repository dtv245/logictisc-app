/**
 * Bộ lọc toàn cục của dashboard.
 *
 * Một hàng duy nhất, đặt trên tất cả những gì nó chi phối — không có bộ lọc
 * riêng lẻ trong từng thẻ biểu đồ, vì như vậy hai biểu đồ cạnh nhau có thể
 * đang nói về hai khoảng thời gian khác nhau mà người đọc không biết.
 *
 * Ngưỡng tham chiếu KHÔNG đổi theo bộ lọc thời gian (mục tiêu quý này không
 * khác mục tiêu quý trước), nhưng ĐỔI theo loại đội xe vì mỗi loại hình có
 * cấu trúc chi phí riêng.
 */

import { Button, Segmented, Select, Space } from "antd";
import { useTranslation } from "react-i18next";

import type { ComparisonMode, ExecutiveFilters } from "@/types/executive.types";
import { FLEET_TYPES, type FleetType } from "../executive.refs";

interface ExecutiveFilterBarProps {
  filters: ExecutiveFilters;
  onChange: (next: ExecutiveFilters) => void;
  /** Các lựa chọn động lấy từ dữ liệu thật; rỗng thì ẩn bộ lọc tương ứng. */
  regionOptions: readonly string[];
  businessUnitOptions: readonly string[];
  customerSegmentOptions: readonly string[];
  onReset: () => void;
}

const RANGE_OPTIONS = [3, 6, 12, 24] as const;

export const ExecutiveFilterBar = ({
  filters,
  onChange,
  regionOptions,
  businessUnitOptions,
  customerSegmentOptions,
  onReset,
}: ExecutiveFilterBarProps) => {
  const { t } = useTranslation();

  const patch = (partial: Partial<ExecutiveFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="exec-filters">
      <Space size="middle" wrap>
        <label className="exec-filters__field">
          <span className="exec-filters__label">
            {t("executive.filters.range")}
          </span>
          <Segmented
            onChange={(value) => patch({ rangeMonths: Number(value) })}
            options={RANGE_OPTIONS.map((months) => ({
              label: t("executive.filters.rangeMonths", { count: months }),
              value: months,
            }))}
            value={filters.rangeMonths}
          />
        </label>

        <label className="exec-filters__field">
          <span className="exec-filters__label">
            {t("executive.filters.region")}
          </span>
          <Select
            onChange={(value) => patch({ region: value })}
            options={[
              { label: t("executive.filters.all"), value: "" },
              ...regionOptions.map((region) => ({ label: region, value: region })),
            ]}
            value={filters.region}
          />
        </label>

        <label className="exec-filters__field">
          <span className="exec-filters__label">
            {t("executive.filters.businessUnit")}
          </span>
          <Select
            onChange={(value) => patch({ businessUnit: value })}
            options={[
              { label: t("executive.filters.all"), value: "" },
              ...businessUnitOptions.map((unit) => ({ label: unit, value: unit })),
            ]}
            value={filters.businessUnit}
          />
        </label>

        <label className="exec-filters__field">
          <span className="exec-filters__label">
            {t("executive.filters.fleetType")}
          </span>
          <Select
            onChange={(value) => patch({ fleetType: value })}
            options={[
              { label: t("executive.filters.all"), value: "" },
              ...FLEET_TYPES.map((fleet: FleetType) => ({
                label: t(`executive.fleetTypes.${fleet}`),
                value: fleet,
              })),
            ]}
            value={filters.fleetType}
          />
        </label>

        <label className="exec-filters__field">
          <span className="exec-filters__label">
            {t("executive.filters.customerSegment")}
          </span>
          <Select
            onChange={(value) => patch({ customerSegment: value })}
            options={[
              { label: t("executive.filters.all"), value: "" },
              ...customerSegmentOptions.map((segment) => ({
                label: segment,
                value: segment,
              })),
            ]}
            value={filters.customerSegment}
          />
        </label>

        <label className="exec-filters__field">
          <span className="exec-filters__label">
            {t("executive.filters.compare")}
          </span>
          <Segmented
            onChange={(value) =>
              patch({ comparison: value as ComparisonMode })
            }
            options={[
              {
                label: t("executive.filters.comparePreviousPeriod"),
                value: "previousPeriod",
              },
              {
                label: t("executive.filters.comparePreviousYear"),
                value: "previousYear",
              },
            ]}
            value={filters.comparison}
          />
        </label>

        <Button onClick={onReset} type="text">
          {t("executive.filters.reset")}
        </Button>
      </Space>
    </div>
  );
};
