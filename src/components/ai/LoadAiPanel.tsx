import { useState } from "react";
import { Button, Card, Flex, Space, Typography } from "antd";
import { HistoryOutlined, RobotOutlined } from "@ant-design/icons";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useLoadAiGaps } from "@/hooks/ai/useLoadAiGaps";
import { AiFeatureBanner } from "./AiFeatureBanner";
import { LoadAiGapsSection } from "./LoadAiGapsSection";
import { LoadAiDispatchSection } from "./LoadAiDispatchSection";
import { AiRunHistoryDrawer } from "./AiRunHistoryDrawer";

const { Text } = Typography;

export interface LoadAiPanelProps {
  loadId: string;
  onNavigateToField?: (fieldKey: string) => void;
}

export const LoadAiPanel = ({ loadId, onNavigateToField }: LoadAiPanelProps) => {
  const { enabled, dryRun, isLoading: isFeaturesLoading } = useAiFeatures();
  const { capabilities } = useLoadAiGaps({ loadId, enabled });
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
                Trung Tâm Trợ Lý AI (LogisticsX AI Assistant)
              </Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tự động rà soát thông tin thiếu/mâu thuẫn và đề xuất phương án điều phối tối ưu.
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

      {/* Khu 1: AI Hỏi (Data Gaps) */}
      <LoadAiGapsSection loadId={loadId} onNavigateToField={onNavigateToField} />

      {/* Khu 2: AI Điều Phối (Dispatch Suggestions) */}
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
