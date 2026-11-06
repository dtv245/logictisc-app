import { Alert, Card, Col, Descriptions, Row, Statistic, Typography } from "antd";
import type { DriverDirectoryItem, DriverProfileSummaryView } from "@/types/drivers/driver-profile.types";
import { DriverProfileSection } from "@/components/drivers/profile/DriverProfileSection";
import { driverProfileSections } from "@/components/drivers/profile/driverProfileSections";
import { useTranslation } from "react-i18next";

const profileSection = driverProfileSections.find((section) => section.key === "profile");

export interface DriverOverviewTabProps {
  driverId: string;
  driver: DriverDirectoryItem;
  summary?: DriverProfileSummaryView;
  canEdit: boolean;
  isAdmin: boolean;
  canViewPayroll: boolean;
}

export function DriverOverviewTab({ driverId, driver, summary, canEdit, isAdmin, canViewPayroll }: DriverOverviewTabProps) {
  const { i18n } = useTranslation();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const joinedDate = driver.joinedDate
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeZone: timezone }).format(new Date(driver.joinedDate))
    : "—";
  const fullAddress = [driver.addressLine1, driver.addressLine2, driver.addressCity, driver.addressState, driver.addressZipCode, driver.addressCountry]
    .filter((part): part is string => Boolean(part?.trim())).join(", ") || "—";

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card title="Thông tin cá nhân">
          <Descriptions bordered column={{ xs: 1, md: 2 }} items={[
            { key: "id", label: "Mã tài xế", children: driver.id || "—" },
            { key: "role", label: "Vai trò", children: driver.roleName || "Tài xế" },
            { key: "email", label: "Email", children: driver.email || "—" },
            { key: "phone", label: "Số điện thoại", children: driver.phoneNumber || "—" },
            { key: "address", label: "Địa chỉ", span: 2, children: fullAddress },
            ...(canViewPayroll ? [{ key: "salary", label: "Hình thức lương", children: driver.salaryType || "—" }] : []),
            { key: "joined", label: "Ngày vào làm", children: joinedDate },
          ]} />
        </Card>
      </Col>
      {summary ? (
        <>
          <Col xs={12} md={6}><Card><Statistic title="Tổng chuyến" value="—" /></Card></Col>
          <Col xs={12} md={6}><Card><Statistic title="Tổng dặm" value="—" /></Card></Col>
          <Col xs={12} md={6}><Card><Statistic title="Vi phạm HOS" value="—" /></Card></Col>
          <Col xs={12} md={6}><Card><Statistic title="Sự cố" value={summary.counts.accidents} /></Card></Col>
        </>
      ) : (
        <Col xs={24}><Alert type="info" showIcon message="Chưa có số liệu tổng hợp từ máy chủ." /></Col>
      )}
      <Col xs={24}>
        <Card title="Hồ sơ bổ sung">
          {profileSection ? <DriverProfileSection definition={profileSection} driverId={driverId} canEdit={canEdit} isAdmin={isAdmin} /> : <Typography.Text type="secondary">Chưa có dữ liệu hồ sơ.</Typography.Text>}
        </Card>
      </Col>
    </Row>
  );
}
