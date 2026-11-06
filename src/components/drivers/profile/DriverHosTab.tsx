import { Alert, Card, Space } from "antd";
import { DriverProfileSection } from "@/components/drivers/profile/DriverProfileSection";
import { driverProfileSections } from "@/components/drivers/profile/driverProfileSections";

const operationalStatus = driverProfileSections.find((section) => section.key === "operational-status");
const violations = driverProfileSections.find((section) => section.key === "violations");

export function DriverHosTab({ driverId, canEdit, isAdmin }: { driverId: string; canEdit: boolean; isAdmin: boolean }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert type="warning" showIcon message="Backend hiện chưa cung cấp duty status, thời gian lái còn lại hoặc bộ đếm nghỉ bắt buộc. Không hiển thị số HOS ước tính." />
      {operationalStatus ? <Card title="Trạng thái vận hành"><DriverProfileSection definition={operationalStatus} driverId={driverId} canEdit={canEdit} isAdmin={isAdmin} /></Card> : null}
      {violations ? <Card title="Vi phạm tài xế"><DriverProfileSection definition={violations} driverId={driverId} canEdit={canEdit} isAdmin={isAdmin} /></Card> : null}
    </Space>
  );
}
