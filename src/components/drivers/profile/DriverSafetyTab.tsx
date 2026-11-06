import { Alert, Card, Space } from "antd";
import { DriverProfileSection } from "@/components/drivers/profile/DriverProfileSection";
import { driverProfileSections } from "@/components/drivers/profile/driverProfileSections";

const accidents = driverProfileSections.find((section) => section.key === "accidents");
const violations = driverProfileSections.find((section) => section.key === "violations");

export function DriverSafetyTab({ driverId, canEdit, isAdmin }: { driverId: string; canEdit: boolean; isAdmin: boolean }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert type="info" showIcon message="Sự kiện hành vi lái xe và DVIR chưa có API hồ sơ tài xế khả dụng." />
      {accidents ? <Card title="Báo cáo sự cố"><DriverProfileSection definition={accidents} driverId={driverId} canEdit={canEdit} isAdmin={isAdmin} /></Card> : null}
      {violations ? <Card title="Vi phạm"><DriverProfileSection definition={violations} driverId={driverId} canEdit={canEdit} isAdmin={isAdmin} /></Card> : null}
    </Space>
  );
}
