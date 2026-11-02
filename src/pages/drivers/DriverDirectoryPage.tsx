import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Input, Select, Space, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FileSearchOutlined, UserOutlined } from "@ant-design/icons";
import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import { driverProfileRoutes } from "@/constants/driverProfileRoutes";
import { routes } from "@/constants/routes";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";
import { formatDateOnly } from "@/formatters/dateTime";
import { ApiHttpError } from "@/utils/httpError";
import type { DriverAvailability, DriverDirectoryItem } from "@/types/drivers/driver-profile.types";

const AVAILABILITIES: readonly DriverAvailability[] = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "ON_LEAVE", "SUSPENDED"];
const errorStatus = (error: unknown): number | undefined => error instanceof ApiHttpError ? error.statusCode : undefined;

export function DriverDirectoryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = normalizePage(Number(searchParams.get("page") ?? 1));
  const pageSize = normalizePageSize(Number(searchParams.get("pageSize") ?? DEFAULT_LIST_PAGE_SIZE));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const availabilityParam = searchParams.get("availability") ?? "";
  const availability = AVAILABILITIES.find((option) => option === availabilityParam) ?? "";

  const loadDrivers = useCallback((signal: AbortSignal) => driverProfileApi.listDrivers({
    page,
    pageSize,
    orderBy: "lastName",
    descending: false,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(status.trim() ? { status: status.trim() } : {}),
    ...(availability ? { availability: availability as DriverAvailability } : {}),
  }, signal), [availability, page, pageSize, search, status]);
  const request = useDriverProfileRequest(loadDrivers);

  const updateFilters = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.set("page", "1");
    setSearchParams(next);
  };

  const columns: ColumnsType<DriverDirectoryItem> = [
    {
      title: t("driverProfile.directory.name"),
      key: "name",
      width: 220,
      render: (_value, row) => (
        <Button type="link" icon={<UserOutlined />} onClick={() => navigate(routes.resources.drivers.show.replace(":id", encodeURIComponent(row.id)))}>
          {row.firstName} {row.lastName}
        </Button>
      ),
    },
    { title: t("driverProfile.fields.email"), dataIndex: "email", width: 230 },
    { title: t("driverProfile.fields.phoneNumber"), dataIndex: "phoneNumber", width: 150, render: (value: string | null) => value || "—" },
    { title: t("driverProfile.fields.employeeStatus"), dataIndex: "status", width: 130, render: (value: string) => <Tag>{value}</Tag> },
    { title: t("driverProfile.fields.joinedDate"), dataIndex: "joinedDate", width: 150, render: (value: string) => formatDateOnly(value, { locale: i18n.language, timeZone: "Asia/Ho_Chi_Minh" }) },
    {
      title: t("common.actions"), key: "actions", fixed: "right", width: 120,
      render: (_value, row) => <Button onClick={() => navigate(routes.resources.drivers.show.replace(":id", encodeURIComponent(row.id)))}>{t("driverProfile.actions.openProfile")}</Button>,
    },
  ];

  if (request.loading && !request.data) return <Spin aria-label={t("asyncState.loading")} />;
  if (request.error) {
    if (errorStatus(request.error) === 403) return <ForbiddenState />;
    if (errorStatus(request.error) === 404) return <NotFoundState />;
    return <QueryErrorState description={request.error instanceof Error ? request.error.message : undefined} onRetry={request.reload} retrying={request.loading} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title={t("driverProfile.directory.title")}
        extra={<Button icon={<FileSearchOutlined />} onClick={() => navigate(driverProfileRoutes.expiring)}>{t("driverProfile.expiring.title")}</Button>}
      />
      <Space wrap size="middle" style={{ width: "100%" }}>
        <Input.Search
          key={`search-${search}`}
          allowClear
          aria-label={t("driverProfile.directory.search")}
          placeholder={t("driverProfile.directory.search")}
          defaultValue={search}
          onSearch={(value) => updateFilters({ search: value.trim() })}
          style={{ width: "min(100%, 340px)" }}
        />
        <Input.Search
          key={`status-${status}`}
          allowClear
          aria-label={t("driverProfile.directory.statusFilter")}
          placeholder={t("driverProfile.directory.statusFilter")}
          defaultValue={status}
          onSearch={(value) => updateFilters({ status: value.trim() })}
          style={{ width: "min(100%, 240px)" }}
        />
        <Select
          allowClear
          aria-label={t("driverProfile.directory.availabilityFilter")}
          placeholder={t("driverProfile.directory.availabilityFilter")}
          value={availability || undefined}
          onChange={(value: string | undefined) => updateFilters({ availability: value ?? "" })}
          options={AVAILABILITIES.map((value) => ({ value, label: t(`driverProfile.values.${value}`) }))}
          style={{ width: "min(100%, 240px)" }}
        />
      </Space>
      <Table<DriverDirectoryItem>
        rowKey="id"
        columns={columns}
        dataSource={request.data?.items ?? []}
        loading={request.loading}
        scroll={{ x: 980 }}
        locale={{ emptyText: <EmptyState description={t("driverProfile.directory.empty")} /> }}
        pagination={{
          current: request.data?.currentPage ?? page,
          pageSize: request.data?.pageSize ?? pageSize,
          total: request.data?.totalItems ?? 0,
          responsive: true,
          ...createListPaginationConfig(t),
          onChange: (nextPage, nextPageSize) => {
            const next = new URLSearchParams(searchParams);
            next.set("page", String(nextPageSize === pageSize ? nextPage : 1));
            next.set("pageSize", String(nextPageSize));
            setSearchParams(next);
          },
        }}
      />
    </Space>
  );
}
