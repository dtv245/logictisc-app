import { LockOutlined } from "@ant-design/icons";
import { Empty, Skeleton, Typography } from "antd";

export interface OperationsChartItem {
  color: string;
  label: string;
  value?: number;
}

interface OperationsChartProps {
  items: readonly OperationsChartItem[];
  isLoading: boolean;
  lockedText: string;
}

export const OperationsChart = ({
  items,
  isLoading,
  lockedText,
}: OperationsChartProps) => {
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} title={false} />;
  }

  const visibleItems = items.filter((item) => item.value !== undefined);
  if (visibleItems.length === 0) {
    return (
      <Empty
        description={lockedText}
        image={<LockOutlined className="dashboard-empty-icon" />}
      />
    );
  }

  const maximum = Math.max(...visibleItems.map((item) => item.value ?? 0), 1);

  return (
    <div className="operations-chart" role="img" aria-label={visibleItems
      .map((item) => `${item.label}: ${item.value ?? 0}`)
      .join(", ")}
    >
      {visibleItems.map((item) => {
        const value = item.value ?? 0;
        const width = value === 0 ? 0 : Math.max((value / maximum) * 100, 4);

        return (
          <div className="operations-chart__row" key={item.label}>
            <div className="operations-chart__label">
              <Typography.Text>{item.label}</Typography.Text>
              <Typography.Text strong>{value.toLocaleString()}</Typography.Text>
            </div>
            <div className="operations-chart__track" aria-hidden="true">
              <span
                className="operations-chart__bar"
                style={{ backgroundColor: item.color, width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

