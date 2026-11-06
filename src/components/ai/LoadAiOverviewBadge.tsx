import { Space, Tag, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { LoadAiOverviewItem } from "@/api/ai/ai.types";

export interface LoadAiOverviewBadgeProps {
  overview?: LoadAiOverviewItem;
}

export const LoadAiOverviewBadge = ({ overview }: LoadAiOverviewBadgeProps) => {
  if (!overview) {
    return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
  }

  const dispatchState =
    overview.dispatchStatus === "EXECUTED"
      ? "assigned"
      : overview.dispatchStatus === "SUGGESTED"
        ? "ready"
        : overview.dispatchState;

  return (
    <Space size={4} wrap align="center" data-testid={`load-ai-badge-${overview.loadId}`}>
      {/* Trạng thái gợi ý điều phối */}
      {dispatchState === "ready" && (
        <Tooltip title="Đã có gợi ý ghép xe tối ưu từ AI">
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            Có xe
          </Tag>
        </Tooltip>
      )}

      {dispatchState === "assigned" && (
        <Tooltip title="Đơn hàng đã được gán xe">
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            Đã gán
          </Tag>
        </Tooltip>
      )}

      {dispatchState === "evidence_unavailable" && (
        <Tooltip title={overview.latestRunSummary || "Lượt chạy gần nhất chưa có đủ bằng chứng để đề xuất điều phối"}>
          <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            Thiếu bằng chứng
          </Tag>
        </Tooltip>
      )}

      {dispatchState === "pending" && (
        <Tooltip title="AI đang tính toán gợi ý điều phối...">
          <Tag color="processing" icon={<ThunderboltOutlined spin />} style={{ margin: 0, padding: "0 6px" }}>
            Đang tính
          </Tag>
        </Tooltip>
      )}

      {dispatchState === "expired" && (
        <Tooltip title="Gợi ý điều phối đã hết hạn hiệu lực">
          <Tag color="default" icon={<ClockCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            Hết hạn
          </Tag>
        </Tooltip>
      )}

      {dispatchState === "not_started" && (
        <Tag color="default" style={{ margin: 0, padding: "0 6px" }}>Chưa chạy</Tag>
      )}
    </Space>
  );
};
