/** Hiển thị dashboard vận hành bằng dữ liệu thật từ API hiện có. */

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

import { APP_I18N_NAMESPACE } from "@locales";
import { useCurrentUser } from "@hooks/useCurrentUser";
import { useCurrentTenant } from "@hooks/useCurrentTenant";
import { useTenantList } from "@hooks/useTenantList";
import type { ApiError } from "@/types/api.types";
import {
  toVehicleMapPoints,
  type DashboardTruckRecord,
} from "./dashboardData";
import { OperationsChart } from "./OperationsChart";
import { VehicleTrackingMap } from "./VehicleTrackingMap";
import "./DashboardPage.scss";

export const DashboardPage = () => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();
  const { tenants } = useTenantList();
  const trucksAccess = useCan({ action: "list", resource: "trucks" });
  const loadsAccess = useCan({ action: "list", resource: "loads" });
  const tripsAccess = useCan({ action: "list", resource: "trips" });
  const canReadTrucks = trucksAccess.data?.can === true;
  const canReadLoads = loadsAccess.data?.can === true;
  const canReadTrips = tripsAccess.data?.can === true;

  const trucks = useList<DashboardTruckRecord, ApiError>({
    resource: "trucks",
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
    <Space direction="vertical" size="large" className="dashboard-page">
      <div className="dashboard-page__heading">
        <div>
          <Typography.Title level={2}>{t("dashboard.title")}</Typography.Title>
          <Typography.Text type="secondary">
            {t("dashboard.greeting", {
              name: currentUser.data?.name ?? t("dashboard.fallbackName"),
            })}
          </Typography.Text>
        </div>
        <Tag color="blue" icon={<EnvironmentOutlined />}>
          {t("dashboard.lastKnownData")}
        </Tag>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-card">
            <Statistic
              className="dashboard-statistic"
              prefix={<BankOutlined />}
              title={t("dashboard.currentTenant")}
              value={tenant?.tenantName ?? t("dashboard.noTenant")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-card">
            <Statistic
              prefix={<UserOutlined />}
              title={t("dashboard.tenantCount")}
              value={tenants.length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-card">
            <Statistic
              loading={trucksAccess.isLoading || trucks.isLoading}
              prefix={<CarOutlined />}
              title={t("dashboard.vehicleCount")}
              value={canReadTrucks ? trucks.data?.total ?? 0 : "—"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="dashboard-card">
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
          <Card
            className="dashboard-card"
            title={t("dashboard.operations.title")}
          >
            <Typography.Text
              className="dashboard-card__subtitle"
              type="secondary"
            >
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
            className="dashboard-card"
            extra={
              <Typography.Text type="secondary">
                {t("dashboard.map.visibleCount", {
                  count: vehiclePoints.length,
                })}
              </Typography.Text>
            }
            title={t("dashboard.map.title")}
          >
            <Typography.Text
              className="dashboard-card__subtitle"
              type="secondary"
            >
              {t("dashboard.map.description")}
            </Typography.Text>
            <VehicleTrackingMap
              errorMessage={trucks.error?.message}
              inaccessibleText={
                trucksAccess.isLoading || canReadTrucks
                  ? ""
                  : t("dashboard.permissionRequired")
              }
              isLoading={trucksAccess.isLoading || (canReadTrucks && trucks.isLoading)}
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
