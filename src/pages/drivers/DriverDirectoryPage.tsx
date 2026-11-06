import { FileSearchOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select, Space } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import { DriverCreateModal } from "@/components/drivers/DriverCreateModal";
import { DriverDirectoryList } from "@/components/drivers/DriverDirectoryList";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { PageHeader } from "@/components/PageHeader";
import { driverProfileRoutes } from "@/constants/driverProfileRoutes";
import { routes } from "@/constants/routes";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";
import { ApiHttpError } from "@/utils/httpError";
import type { DriverAvailability, DriverDirectoryItem } from "@/types/drivers/driver-profile.types";

const AVAILABILITIES: readonly DriverAvailability[] = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "ON_LEAVE", "SUSPENDED"];
const DRIVER_STATUSES = ["active", "inactive", "on_leave", "terminated"] as const;
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
  const [searchDraft, setSearchDraft] = useState(search);
  const [lastAppliedSearch, setLastAppliedSearch] = useState(search);
  const debouncedSearch = useDebouncedSearch(searchDraft, 300);

  if (search !== lastAppliedSearch) {
    setLastAppliedSearch(search);
    setSearchDraft(search);
  }

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.set("page", "1");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const nextSearch = debouncedSearch.trim();
    if (nextSearch !== search.trim()) {
      updateFilters({ search: nextSearch });
    }
  }, [debouncedSearch, search, updateFilters]);

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

  const openProfile = useCallback((driver: DriverDirectoryItem) => {
    navigate(routes.resources.drivers.show.replace(":id", encodeURIComponent(driver.id)));
  }, [navigate]);

  if (request.error) {
    if (errorStatus(request.error) === 403) return <ForbiddenState />;
    if (errorStatus(request.error) === 404) return <NotFoundState />;
    return <QueryErrorState description={request.error instanceof Error ? request.error.message : undefined} onRetry={request.reload} retrying={request.loading} />;
  }

  const drivers = request.data?.items ?? [];
  const statuses = [...new Set([...DRIVER_STATUSES, ...drivers.map((driver) => driver.status).filter(Boolean)])]
    .sort((left, right) => left.localeCompare(right));

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title={t("driverProfile.directory.title")}
        extra={(
          <Space wrap>
            <DriverCreateModal
              onCreated={() => request.reload()}
              trigger={(show) => (
                <Button type="primary" icon={<PlusOutlined />} onClick={show}>
                  {t("actions.create", "Thêm mới")}
                </Button>
              )}
            />
            <Button icon={<FileSearchOutlined />} onClick={() => navigate(driverProfileRoutes.expiring)}>
              {t("driverProfile.expiring.title")}
            </Button>
          </Space>
        )}
      />


      <Space className="driver-directory-filters" wrap size="middle">
        <Input
          allowClear
          aria-label={t("driverProfile.directory.search")}
          className="driver-directory-search"
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder={t("driverProfile.directory.search")}
          prefix={<SearchOutlined />}
          value={searchDraft}
        />
        <Select
          allowClear
          aria-label={t("driverProfile.directory.statusFilter")}
          className="driver-directory-status-filter"
          onChange={(value: string | undefined) => updateFilters({ status: value ?? "" })}
          options={statuses.map((value) => ({ label: value, value }))}
          placeholder={t("driverProfile.directory.statusFilter")}
          value={status || undefined}
        />
        <Select
          allowClear
          aria-label={t("driverProfile.directory.availabilityFilter")}
          className="driver-directory-availability-filter"
          onChange={(value: string | undefined) => updateFilters({ availability: value ?? "" })}
          options={AVAILABILITIES.map((value) => ({ value, label: t(`driverProfile.values.${value}`) }))}
          placeholder={t("driverProfile.directory.availabilityFilter")}
          value={availability || undefined}
        />
      </Space>

      <DriverDirectoryList
        drivers={drivers}
        emptyDescription={t("driverProfile.directory.empty")}
        loading={request.loading}
        locale={i18n.language}
        onOpenProfile={openProfile}
        pagination={{
          current: request.data?.currentPage ?? page,
          pageSize: request.data?.pageSize ?? pageSize,
          total: request.data?.totalItems ?? 0,
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
