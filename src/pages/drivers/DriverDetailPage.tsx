import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Breadcrumb, Button, Card, Empty, Result, Skeleton, Space, Tabs, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDriver } from "@/hooks/drivers/useDriver";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import { DriverHeader } from "@/components/drivers/profile/DriverHeader";
import { DriverOverviewTab } from "@/components/drivers/profile/DriverOverviewTab";
import { DriverLicenseTab } from "@/components/drivers/profile/DriverLicenseTab";
import { DriverHosTab } from "@/components/drivers/profile/DriverHosTab";
import { DriverTripsTab } from "@/components/drivers/profile/DriverTripsTab";
import { DriverSafetyTab } from "@/components/drivers/profile/DriverSafetyTab";
import { routes } from "@/constants/routes";
import { ApiHttpError } from "@/utils/httpError";
import { daysUntil, getExpiryTagColor } from "@/utils/drivers/driverDetailFormatters";
import type { DriverProfileSummaryView } from "@/types/drivers/driver-profile.types";

const isAllowed = (roles: readonly string[] | undefined, allowed: readonly string[]) =>
  Boolean(roles?.some((role) => allowed.includes(role)));

const getErrorStatus = (error: unknown): number | undefined => error instanceof ApiHttpError ? error.statusCode : undefined;

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const user = useCurrentUser();
  const driver = useDriver(id);
  const [activeTab, setActiveTab] = useState("overview");
  const canRead = isAllowed(user.data?.roles, ["ADMIN", "DISPATCHER"]);
  const canEdit = isAllowed(user.data?.roles, ["ADMIN", "DISPATCHER"]);
  const isAdmin = isAllowed(user.data?.roles, ["ADMIN"]);
  const canViewPayroll = isAllowed(user.data?.roles, ["ADMIN", "PAYROLL", "PAYROLL_MANAGER"]);
  const loadSummary = useCallback((signal: AbortSignal) =>
    id ? driverProfileApi.getSummary(id, signal) : Promise.reject(new Error("DRIVER_ID_REQUIRED")), [id]);
  const summary = useDriverProfileRequest<DriverProfileSummaryView>(loadSummary, canRead && Boolean(id));

  if (user.isLoading || driver.isLoading) return <Card><Skeleton active avatar paragraph={{ rows: 5 }} /></Card>;
  if (!id || getErrorStatus(driver.error) === 404) return <Result status="404" title="Không tìm thấy tài xế" extra={<Button onClick={() => navigate(routes.resources.drivers.list)}>Về danh sách tài xế</Button>} />;
  if (!canRead) return <Result status="403" title="Bạn không có quyền xem hồ sơ tài xế" />;
  if (driver.error) return <Result status="error" title="Không tải được hồ sơ tài xế" subTitle={driver.error instanceof Error ? driver.error.message : undefined} extra={<Button onClick={driver.reload}>Thử lại</Button>} />;
  if (!driver.data) return <Empty description="Không có dữ liệu tài xế." />;

  const expiryAlerts = (summary.data?.upcomingExpirations ?? []).filter((item) => {
    const remaining = daysUntil(item.expiryDate);
    return remaining !== null && remaining <= 30;
  });
  const expired = expiryAlerts.some((item) => item.daysUntilExpiry < 0);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const joinedDate = driver.data.joinedDate ? new Date(driver.data.joinedDate) : undefined;
  const joinedDateLabel = joinedDate && Number.isFinite(joinedDate.getTime())
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeZone: timezone }).format(joinedDate)
    : "—";

  const tabItems = [
    { key: "overview", label: "Tổng quan", children: <DriverOverviewTab driverId={id} driver={driver.data} summary={summary.data} canEdit={canEdit} isAdmin={isAdmin} canViewPayroll={canViewPayroll} /> },
    { key: "licenses", label: "Bằng lái & giấy tờ", children: <DriverLicenseTab driverId={id} canEdit={canEdit} isAdmin={isAdmin} /> },
    { key: "hos", label: "Giờ làm việc (HOS)", children: <DriverHosTab driverId={id} canEdit={canEdit} isAdmin={isAdmin} /> },
    { key: "trips", label: "Chuyến đi", children: <DriverTripsTab /> },
    { key: "safety", label: "An toàn", children: <DriverSafetyTab driverId={id} canEdit={canEdit} isAdmin={isAdmin} /> },
    ...(canViewPayroll ? [{
      key: "payroll", label: "Lương", children: <Space direction="vertical" style={{ width: "100%" }}>
        <Card title="Thông tin lương"><Alert type="info" showIcon message={`Hình thức lương: ${driver.data.salaryType || "—"}`} /></Card>
        <Alert type="warning" showIcon message="API quyết toán theo tài xế chưa được cung cấp; không hiển thị số liệu ước tính." />
      </Space>,
    }] : []),
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex", width: "100%" }}>
      <Breadcrumb items={[
        { title: <Link to={routes.resources.drivers.list}>Tài xế</Link> },
        { title: `${driver.data.firstName} ${driver.data.lastName}`.trim() || "Chi tiết" },
      ]} />
      <DriverHeader driver={driver.data} joinedDateLabel={joinedDateLabel} onEdit={() => navigate(routes.resources.drivers.edit.replace(":id", encodeURIComponent(id)))} />
      {summary.loading ? <Card><Skeleton active paragraph={{ rows: 2 }} /></Card> : null}
      {summary.error ? <Alert type="warning" showIcon message="Một số dữ liệu tổng hợp chưa tải được." description={summary.error instanceof Error ? summary.error.message : undefined} /> : null}
      {expiryAlerts.length > 0 ? (
        <Alert
          type={expired ? "error" : "warning"}
          showIcon
          message={expired ? "Có giấy tờ đã hết hạn" : "Giấy tờ sắp hết hạn trong 30 ngày"}
          description={<Space wrap>{expiryAlerts.map((item) => <span key={`${item.type}-${item.itemId}`}>{item.itemName}: <Tag color={getExpiryTagColor(item.expiryStatus)}>{new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeZone: timezone }).format(new Date(item.expiryDate))}</Tag></span>)}</Space>}
        />
      ) : null}
      <Card bodyStyle={{ paddingTop: 8 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} destroyOnHidden items={tabItems} />
      </Card>
    </Space>
  );
}
