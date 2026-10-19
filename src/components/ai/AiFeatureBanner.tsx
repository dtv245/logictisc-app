import { Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export interface AiFeatureBannerProps {
  dryRun?: boolean;
}

export const AiFeatureBanner = ({ dryRun = false }: AiFeatureBannerProps) => {
  if (!dryRun) return null;

  return (
    <Alert
      message="Chế độ thử: AI chỉ tính toán, chưa gửi tin ra ngoài"
      type="info"
      showIcon
      icon={<InfoCircleOutlined />}
      style={{ marginBottom: 16 }}
      data-testid="ai-dry-run-banner"
    />
  );
};
