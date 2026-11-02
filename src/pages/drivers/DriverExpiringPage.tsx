import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, InputNumber, Select, Space, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import { routes } from "@/constants/routes";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";
import { formatDateOnly } from "@/formatters/dateTime";
import { ApiHttpError } from "@/utils/httpError";
import type { DriverExpiringItemView, DriverExpiringType } from "@/types/drivers/driver-profile.types";

const EXPIRING_TYPES: readonly DriverExpiringType[] = [
  "LICENSE", "LICENSE_MEDICAL_CERTIFICATE", "HEALTH_CHECK", "CERTIFICATION", "CONTRACT", "HEALTH_INSURANCE", "DOCUMENT",
];
const errorStatus = (error: unknown): number | undefined => error instanceof ApiHttpError ? error.statusCode : undefined;

/**
 * Older server builds without the literal /api/drivers/expiring route let the
 * request fall through to /api/drivers/{id}, which answers 400 because
 * "expiring" is not a UUID. Treat that (and a missing route) as unavailable
 * instead of showing a raw transport error or an empty list.
 */
const isExpiringEndpointUnavailable = (error: unknown): boolean => {
  if (!(error instanceof ApiHttpError)) return false;
  if (error.statusCode === 404) return true;
  return error.statusCode === 400
    && /\bexpiring\b/i.test(error.message)
    && /expected type '?UUID'?/i.test(error.message);
};

export function DriverExpiringPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const days = Math.max(1, Math.min(365, Number(searchParams.get("days") ?? 30) || 30));
  const typeParam = searchParams.get("type");
  const type = EXPIRING_TYPES.find((option) => option === typeParam) ?? undefined;
  const page = normalizePage(Number(searchParams.get("page") ?? 1));
  const pageSize = normalizePageSize(Number(searchParams.get("pageSize") ?? DEFAULT_LIST_PAGE_SIZE));

  const loadExpiring = useCallback((signal: AbortSignal) => driverProfileApi.listExpiring({
    days, page, pageSize, ...(type ? { type } : {}),
  }, signal), [days, page, pageSize, type]);
  const request = useDriverProfileRequest(loadExpiring);

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.set("page", "1");
    setSearchParams(next);
  };

  const columns: ColumnsType<DriverExpiringItemView> = [
    { title: t("driverProfile.expiring.driver"), dataIndex: "driverName", width: 220 },
    { title: t("driverProfile.expiring.item"), dataIndex: "itemName", width: 260 },
    { title: t("driverProfile.expiring.type"), dataIndex: "type", width: 190, render: (value: DriverExpiringType) => t(`driverProfile.expiring.types.${value}`) },
    { title: t("driverProfile.fields.expiryDate"), dataIndex: "expiryDate", width: 150, render: (value: string) => formatDateOnly(value, { locale: i18n.language, timeZone: "Asia/Ho_Chi_Minh" }) },
    { title: t("driverProfile.expiring.daysRemaining"), dataIndex: "daysUntilExpiry", width: 140, render: (value: number) => value < 0 ? t("driverProfile.expiring.daysOverdue", { count: Math.abs(value) }) : t("driverProfile.expiring.days", { count: value }) },
    { title: t("driverProfile.fields.expiryStatus"), dataIndex: "expiryStatus", width: 150, render: (value: string) => <Tag color={value === "EXPIRED" ? "red" : value === "EXPIRING_SOON" ? "orange" : "green"}>{t(`driverProfile.expiryStatuses.${value}`)}</Tag> },
    { title: t("common.actions"), key: "actions", width: 140, fixed: "right", render: (_value, row) => <Button onClick={() => navigate(routes.resources.drivers.show.replace(":id", encodeURIComponent(row.driverId)))}>{t("driverProfile.actions.openProfile")}</Button> },
  ];

  if (request.loading && !request.data) return <Spin aria-label={t("asyncState.loading")} />;
  if (request.error) {
    if (errorStatus(request.error) === 403) return <ForbiddenState />;
    if (isExpiringEndpointUnavailable(request.error)) {
      return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <PageHeader title={t("driverProfile.expiring.title")} />
          <Alert
            type="info"
            showIcon
            message={t("driverProfile.expiring.unavailable")}
            description={t("driverProfile.expiring.unavailableDescription")}
            action={<Button onClick={request.reload} loading={request.loading}>{t("actions.retry")}</Button>}
          />
        </Space>
      );
    }
    return <QueryErrorState description={request.error instanceof Error ? request.error.message : undefined} onRetry={request.reload} retrying={request.loading} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader title={t("driverProfile.expiring.title")} />
      <Space wrap>
        <label htmlFor="driver-expiring-days">{t("driverProfile.expiring.daysFilter")}</label>
        <InputNumber
          id="driver-expiring-days"
          min={1}
          max={365}
          value={days}
          onChange={(value) => updateQuery({ days: value === null ? "30" : String(value) })}
          aria-label={t("driverProfile.expiring.daysFilter")}
        />
        <Select
          allowClear
          aria-label={t("driverProfile.expiring.typeFilter")}
          placeholder={t("driverProfile.expiring.typeFilter")}
          value={type ?? undefined}
          options={EXPIRING_TYPES.map((value) => ({ value, label: t(`driverProfile.expiring.types.${value}`) }))}
          onChange={(value: DriverExpiringType | undefined) => updateQuery({ type: value })}
          style={{ width: "min(100%, 280px)" }}
        />
      </Space>
      <Table<DriverExpiringItemView>
        rowKey="itemId"
        columns={columns}
        dataSource={request.data?.items ?? []}
        loading={request.loading}
        scroll={{ x: 1180 }}
        locale={{ emptyText: <EmptyState description={t("driverProfile.expiring.empty")} /> }}
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
