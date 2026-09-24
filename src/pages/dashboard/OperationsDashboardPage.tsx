/**
 * Operations Dashboard — màn hình điều phối.
 *
 * Trả lời câu hỏi "hôm nay có bao nhiêu xe, bao nhiêu chuyến, xe đang ở đâu" bằng
 * dữ liệu API có thật. Đây KHÔNG phải màn hình của ban điều hành: nó hiển thị
 * bản ghi thô và vị trí gần nhất, không đưa ra kết luận.
 *
 * Hai màn hình cùng tồn tại vì chúng trả lời hai câu hỏi khác nhau. Executive
 * Overview (`DashboardPage.tsx`) không thay thế được màn hình này: nó cần các
 * endpoint tổng hợp chưa có, còn màn hình này chạy được ngay trên CRUD hiện tại.
 */

import {
  BankOutlined,
  CarOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useCan, useList } from "@refinedev/core";
import { Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@components/PageHeader";
import { OperationsChart } from "@features/operations/components/OperationsChart";
import { VehicleTrackingMap } from "@features/operations/components/VehicleTrackingMap";
import {
  toVehicleMapPoints,
  type OperationsTruckRecord,
} from "@features/operations/operations.data";
import { useCurrentTenant } from "@hooks/useCurrentTenant";
import { useCurrentUser } from "@hooks/useCurrentUser";
import { useTenantList } from "@hooks/useTenantList";
import type { ApiError } from "@/types/api.types";
import "./OperationsDashboardPage.scss";

export const OperationsDashboardPage = () => {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();
  const { tenants } = useTenantList();

  const trucksAccess = useCan({ action: "list", resource: "trucks" });
  const loadsAccess = useCan({ action: "list", resource: "loads" });
  const tripsAccess = useCan({ action: "list", resource: "trips" });
  const canReadTrucks = trucksAccess.data?.can === true;
  const canReadLoads = loadsAccess.data?.can === true;
  const canReadTrips = tripsAccess.data?.can === true;

  const trucks = useList<OperationsTruckRecord, ApiError>({
    resource: "trucks",
    // 100 là trần của backend (`Constants.MAX_PAGE_SIZE`). Màn hình này chỉ
    // hiển thị những gì lấy được trong một trang và nói rõ điều đó ở phần mô tả
    // bản đồ — không cộng dồn nhiều trang rồi trình bày như số liệu toàn công ty.
    pagination: { current: 1, pageSize: 100 },
    queryOptions: { enabled: canReadTrucks, staleTime: 30_000 },
  });
  const loads = useList({
    resource: "loads",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: { enabled: canReadLoads, staleTime: 30_000 },
  });
  const trips = useList({
    resource: "trips",
    pagination: { current: 1, pageSize: 1 },
    queryOptions: { enabled: canReadTrips, staleTime: 30_000 },
  });

  const vehiclePoints = useMemo(
    () => toVehicleMapPoints(trucks.data?.data ?? []),
    [trucks.data?.data],
  );

  // Nhãn trạng thái của xe là chuỗi tự do từ backend, không phải enum — dịch
  // được thì dịch, không thì giữ nguyên chuỗi gốc thay vì hiện khoá thô.
  const getStatusLabel = useCallback(
    (status: string) =>
      t(`forms.options.${status}`, { defaultValue: status }),
    [t],
  );

  const permissionsLoading =
    trucksAccess.isLoading || loadsAccess.isLoading || tripsAccess.isLoading;

  const chartItems = [
    {
      color: "#2563eb",
      label: t("dashboard.operations.trucks"),
      value: canReadTrucks ? trucks.data?.total : undefined,
    },
    {
      color: "#14b8a6",
      label: t("dashboard.operations.loads"),
      value: canReadLoads ? loads.data?.total : undefined,
    },
    {
      color: "#f59e0b",
      label: t("dashboard.operations.trips"),
      value: canReadTrips ? trips.data?.total : undefined,
    },
  ];

  return (
    <Space className="ops-page" direction="vertical" size="large">
      <PageHeader
        description={t("dashboard.greeting", {
          name: currentUser.data?.name ?? t("dashboard.fallbackName"),
        })}
        extra={
          <Tag color="blue" icon={<EnvironmentOutlined />}>
            {t("dashboard.lastKnownData")}
          </Tag>
        }
        title={t("dashboard.operations.pageTitle")}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="ops-card">
            <Statistic
              className="ops-statistic"
              prefix={<BankOutlined />}
              title={t("dashboard.currentTenant")}
              value={tenant?.tenantName ?? t("dashboard.noTenant")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="ops-card">
            <Statistic
              prefix={<UserOutlined />}
              title={t("dashboard.tenantCount")}
              value={tenants.length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="ops-card">
            <Statistic
              loading={trucksAccess.isLoading || trucks.isLoading}
              prefix={<CarOutlined />}
              title={t("dashboard.vehicleCount")}
              value={canReadTrucks ? trucks.data?.total ?? 0 : "—"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="ops-card">
            <Statistic
              loading={trucksAccess.isLoading || trucks.isLoading}
              prefix={<EnvironmentOutlined />}
              title={t("dashboard.locatedVehicleCount")}
              value={canReadTrucks ? vehiclePoints.length : "—"}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card className="ops-card" title={t("dashboard.operations.title")}>
            <Typography.Text className="ops-card__subtitle" type="secondary">
              {t("dashboard.operations.description")}
            </Typography.Text>
            <OperationsChart
              isLoading={
                permissionsLoading ||
                (canReadTrucks && trucks.isLoading) ||
                (canReadLoads && loads.isLoading) ||
                (canReadTrips && trips.isLoading)
              }
              items={chartItems}
              lockedText={t("dashboard.permissionRequired")}
            />
          </Card>
        </Col>
        <Col xs={24} xl={15}>
          <Card
            className="ops-card"
            extra={
              <Typography.Text type="secondary">
                {t("dashboard.map.visibleCount", {
                  count: vehiclePoints.length,
                })}
              </Typography.Text>
            }
            title={t("dashboard.map.title")}
          >
            <Typography.Text className="ops-card__subtitle" type="secondary">
              {t("dashboard.map.description")}
            </Typography.Text>
            <VehicleTrackingMap
              errorMessage={trucks.error?.message}
              inaccessibleText={
                trucksAccess.isLoading || canReadTrucks
                  ? ""
                  : t("dashboard.permissionRequired")
              }
              isLoading={
                trucksAccess.isLoading || (canReadTrucks && trucks.isLoading)
              }
              loadErrorText={t("dashboard.map.loadError")}
              mapLabel={t("dashboard.map.ariaLabel")}
              noLocationText={t("dashboard.map.noLocation")}
              points={vehiclePoints}
              statusLabel={getStatusLabel}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
