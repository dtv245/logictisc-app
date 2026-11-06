import { Alert, Card, Space } from "antd";
import { DriverProfileSection } from "@/components/drivers/profile/DriverProfileSection";
import { driverProfileSections } from "@/components/drivers/profile/driverProfileSections";

const sections = ["licenses", "health-checks", "certifications"]
  .map((key) => driverProfileSections.find((section) => section.key === key))
  .filter((section): section is NonNullable<typeof section> => Boolean(section));

export function DriverLicenseTab({ driverId, canEdit, isAdmin }: { driverId: string; canEdit: boolean; isAdmin: boolean }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert type="info" showIcon message="Số bằng lái được ẩn theo quyền truy cập dữ liệu nhạy cảm." />
      {sections.map((section) => <Card key={section.key} title={section.key === "licenses" ? "Bằng lái" : section.key === "health-checks" ? "Giấy khám sức khỏe" : "Chứng chỉ"}>
        <DriverProfileSection definition={section} driverId={driverId} canEdit={canEdit} isAdmin={isAdmin} />
      </Card>)}
      <Alert type="warning" showIcon message="Liên kết tải tài liệu sẽ hiển thị khi API tài liệu theo hồ sơ tài xế được cung cấp." />
    </Space>
  );
}
