import { useState } from "react";
import { Button, Card, Flex, Space, Typography } from "antd";
import { HistoryOutlined, RobotOutlined } from "@ant-design/icons";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useLoadAiDispatch } from "@/hooks/ai/useLoadAiDispatch";
import { AiFeatureBanner } from "./AiFeatureBanner";
import { LoadAiDispatchSection } from "./LoadAiDispatchSection";
import { AiRunHistoryDrawer } from "./AiRunHistoryDrawer";

const { Text } = Typography;

export interface LoadAiPanelProps {
  loadId: string;
}

export const LoadAiPanel = ({ loadId }: LoadAiPanelProps) => {
  const { enabled, dryRun, isLoading: isFeaturesLoading } = useAiFeatures();
  const { capabilities } = useLoadAiDispatch({ loadId, enabled });
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Quy tắc: Nếu cờ tính năng tắt, ẩn toàn bộ UI AI, không báo lỗi
  if (!isFeaturesLoading && !enabled) {
    return null;
  }

  const canViewRuns = Boolean(capabilities?.canViewRuns);

  return (
    <div data-testid="load-ai-panel">
      {/* Banner cảnh báo chế độ thử nghiệm */}
      <AiFeatureBanner dryRun={dryRun} />

      {/* Action bar đầu trang */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          backgroundColor: "#f9f0ff",
          borderColor: "#d3adf7",
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Space>
            <RobotOutlined style={{ fontSize: 20, color: "#722ed1" }} />
            <div>
              <Text strong style={{ fontSize: 15, color: "#531dab" }}>
                  Trợ lý điều phối AI LogisticsX
              </Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Đề xuất phương án điều phối dựa trên trạng thái Load và bằng chứng hiện có.
                </Text>
              </div>
            </div>
          </Space>

          {canViewRuns && (
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setHistoryDrawerOpen(true)}
              data-testid="open-ai-runs-btn"
            >
              Lịch sử chạy AI & Chi phí
            </Button>
          )}
        </Flex>
      </Card>

      {/* Đề xuất điều phối AI */}
      <LoadAiDispatchSection loadId={loadId} />

      {/* Drawer Lịch sử chạy AI */}
      <AiRunHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        loadId={loadId}
        canViewRuns={canViewRuns}
      />
    </div>
  );
};
