import { Space, Tag, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
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

  const blockingGaps = overview.blockingGapsCount ?? overview.blockingGaps ?? 0;
  const warningGaps = overview.warningGapsCount ?? overview.warningGaps ?? 0;
  const dispatchState =
    overview.dispatchStatus === "SUGGESTED" || overview.dispatchStatus === "EXECUTED"
      ? "ready"
      : overview.dispatchState;

  return (
    <Space size={4} wrap align="center" data-testid={`load-ai-badge-${overview.loadId}`}>
      {/* Badge Gap Chặn */}
      {blockingGaps > 0 && (
        <Tooltip title={`Có ${blockingGaps} thông tin chặn cần điền`}>
          <Tag color="error" icon={<ExclamationCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            {blockingGaps} chặn
          </Tag>
        </Tooltip>
      )}

      {/* Badge Gap Cảnh báo */}
      {warningGaps > 0 && (
        <Tooltip title={`Có ${warningGaps} cảnh báo từ AI`}>
          <Tag color="warning" icon={<MinusCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            {warningGaps} lưu ý
          </Tag>
        </Tooltip>
      )}

      {/* Trạng thái gợi ý điều phối */}
      {dispatchState === "ready" && (
        <Tooltip title="Đã có gợi ý ghép xe tối ưu từ AI">
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0, padding: "0 6px" }}>
            Có xe
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

      {blockingGaps === 0 && warningGaps === 0 && dispatchState === "not_started" && (
        <span style={{ color: "#8c8c8c", fontSize: 12 }}>Đủ tin</span>
      )}
    </Space>
  );
};
