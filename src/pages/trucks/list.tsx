import { useCallback, useMemo, useState } from "react";
import { useCan, useList } from "@refinedev/core";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Input,
  Select,
  Tag,
} from "antd";
import type { CrudFilters } from "@refinedev/core";
import type { DescriptionsProps } from "antd";
import { useNavigate } from "react-router-dom";

import { DEFAULT_VEHICLE_IMAGE, PAGE_SIZE, VEHICLE_STATUS_OPTIONS } from "@/constants/vehicle";
import { routes } from "@/constants/routes";
import { TruckCreateModal } from "@/components/trucks/TruckCreateModal";
import { VehicleList } from "@/components/trucks/VehicleList";
import { VehicleStatus } from "@/components/trucks/VehicleStatus";
import type { ApiError } from "@/types/api.types";
import type { Vehicle } from "@/types/trucks/vehicle.types";
import { formatCapacity, formatCapacityAlt, formatLocation, getVehicleImage, getVehicleTypeLabel, normalizeVi } from "@/utils/vehicle";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

import styles from "./VehicleListPage.module.css";

const ALL_FILTER_VALUE = "ALL";
const EMPTY_VEHICLES: Vehicle[] = [];

export const TruckList = () => {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { data: createPermission } = useCan({ action: "create", resource: "trucks" });
  const { data: editPermission } = useCan({ action: "edit", resource: "trucks" });
  const { data: deletePermission } = useCan({ action: "delete", resource: "trucks" });
  const canCreate = createPermission?.can === true;
  const canEdit = editPermission?.can === true;
  const canDeactivate = deletePermission?.can === true;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedSearch(search, 300);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER_VALUE);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const baseFilters = useMemo<CrudFilters>(() => {
    const filters: CrudFilters = [];
    if (statusFilter !== ALL_FILTER_VALUE) {
      filters.push({ field: "status", operator: "eq", value: statusFilter });
    }
    if (typeFilter !== ALL_FILTER_VALUE) {
      filters.push({ field: "type", operator: "eq", value: typeFilter });
    }
    return filters;
  }, [statusFilter, typeFilter]);

  const searchFilters = useMemo<CrudFilters>(() => {
    const filters = [...baseFilters];
    if (debouncedSearch.trim()) {
      filters.push({ field: "search", operator: "contains", value: debouncedSearch.trim() });
    }
    return filters;
  }, [baseFilters, debouncedSearch]);

  const baseQuery = useList<Vehicle, ApiError>({
    resource: "trucks",
    pagination: { current: currentPage, pageSize: PAGE_SIZE, mode: "server" },
    filters: baseFilters,
    queryOptions: { keepPreviousData: true, staleTime: 30_000 },
  });
  const typeSourceQuery = useList<Vehicle, ApiError>({
    resource: "trucks",
    pagination: { current: 1, pageSize: PAGE_SIZE, mode: "server" },
    filters: [],
    queryOptions: { keepPreviousData: true, staleTime: 30_000 },
  });
  const searchQuery = useList<Vehicle, ApiError>({
    resource: "trucks",
    pagination: { current: currentPage, pageSize: PAGE_SIZE, mode: "server" },
    filters: searchFilters,
    queryOptions: {
      enabled: Boolean(debouncedSearch.trim()),
      keepPreviousData: true,
      staleTime: 30_000,
    },
  });

  const baseVehicles = baseQuery.data?.data ?? EMPTY_VEHICLES;
  const typeSourceVehicles = typeSourceQuery.data?.data ?? EMPTY_VEHICLES;
  const serverSearchVehicles = searchQuery.data?.data ?? EMPTY_VEHICLES;
  const searchValue = debouncedSearch.trim();
  const useLocalSearchFallback = Boolean(
    searchValue &&
    searchQuery.isFetched &&
    !searchQuery.isFetching &&
    !searchQuery.isError &&
    searchQuery.data?.total === 0,
  );

  const typeChips = useMemo(() => {
    const types = new Set([
      ...typeSourceVehicles.map((vehicle) => vehicle.type),
      ...baseVehicles.map((vehicle) => vehicle.type),
    ]);
    if (typeFilter !== ALL_FILTER_VALUE) types.add(typeFilter);
    return [...types].sort((left, right) =>
      getVehicleTypeLabel(left).localeCompare(getVehicleTypeLabel(right), "vi"),
    );
  }, [baseVehicles, typeFilter, typeSourceVehicles]);

  const localSearchVehicles = useMemo(() => {
    if (!useLocalSearchFallback || !searchValue) return [];
    const query = normalizeVi(searchValue);
    return baseVehicles.filter((vehicle) => {
      const searchableFields = [
        vehicle.number,
        vehicle.licensePlate,
        vehicle.vin,
        vehicle.make,
        vehicle.model,
        vehicle.mainDriverName,
        vehicle.secondaryDriverName,
      ];
      return normalizeVi(searchableFields.filter(Boolean).join(" ")).includes(query);
    });
  }, [baseVehicles, searchValue, useLocalSearchFallback]);

  const { vehicles, totalItems } = useMemo(() => {
    if (useLocalSearchFallback) {
      return { vehicles: localSearchVehicles, totalItems: localSearchVehicles.length };
    }
    if (searchValue) {
      return { vehicles: serverSearchVehicles, totalItems: searchQuery.data?.total ?? 0 };
    }
    return { vehicles: baseVehicles, totalItems: baseQuery.data?.total ?? 0 };
  }, [
    baseQuery.data?.total,
    baseVehicles,
    localSearchVehicles,
    searchQuery.data?.total,
    searchValue,
    serverSearchVehicles,
    useLocalSearchFallback,
  ]);
  const loading = baseQuery.isLoading || (Boolean(searchValue) && searchQuery.isLoading);
  const hasError = baseQuery.isError || (Boolean(searchValue) && searchQuery.isError);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);
  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);
  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);
  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);
  const handleDetail = useCallback((vehicle: Vehicle) => setSelected(vehicle), []);
  const handleCloseDrawer = useCallback(() => setSelected(null), []);
  const handleEdit = useCallback((vehicle: Vehicle) => {
    navigate(routes.resources.trucks.edit.replace(":id", encodeURIComponent(vehicle.id)));
  }, [navigate]);
  const handleRegistration = useCallback(() => {
    // TODO: kết nối khi API inspection hỗ trợ lọc lịch sử theo truckId.
    message.info("API tra cứu lịch sử đăng kiểm theo xe chưa được hỗ trợ.");
  }, [message]);
  const handleAssignDriver = useCallback((vehicle: Vehicle) => {
    navigate(routes.resources.trucks.edit.replace(":id", encodeURIComponent(vehicle.id)));
    message.info("Cập nhật tài xế trong biểu mẫu chỉnh sửa xe.");
  }, [message, navigate]);
  const handleDeactivate = useCallback((vehicle: Vehicle) => {
    modal.confirm({
      title: "Vô hiệu hóa xe?",
      content: `Xe ${vehicle.licensePlate ?? vehicle.number} sẽ không thể được gán vào chuyến đi mới.`,
      okText: "Vô hiệu hóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => {
        // TODO: gọi API khi backend cung cấp endpoint đổi trạng thái xe.
        message.info("API vô hiệu hóa xe chưa được hỗ trợ.");
      },
    });
  }, [message, modal]);

  const descriptions = useMemo<DescriptionsProps["items"]>(() => {
    if (!selected) return [];
    const capacityAlt = formatCapacityAlt(selected.vehicleCapacity);
    return [
      { key: "number", label: "Mã xe", children: selected.number },
      {
        key: "type",
        label: "Loại xe",
        children: `${getVehicleTypeLabel(selected.type)} (${selected.type})`,
      },
      {
        key: "plate",
        label: "Biển số",
        children: selected.licensePlate
          ? `${selected.licensePlate}${selected.licensePlateState ? ` (${selected.licensePlateState})` : ""}`
          : "Chưa có biển số",
      },
      {
        key: "model",
        label: "Hãng / Model",
        children: [selected.make, selected.model].filter(Boolean).join(" ") || "—",
      },
      { key: "year", label: "Năm SX", children: selected.year ?? "—" },
      { key: "vin", label: "VIN", children: selected.vin ?? "—" },
      {
        key: "capacity",
        label: "Sức chở",
        children: `${formatCapacity(selected.vehicleCapacity)}${capacityAlt ? ` (${capacityAlt})` : ""}`,
      },
      { key: "driver", label: "Tài xế chính", children: selected.mainDriverName ?? "Chưa gán" },
      { key: "driver2", label: "Tài xế phụ", children: selected.secondaryDriverName ?? "—" },
      {
        key: "adr",
        label: "ADR",
        children: selected.adrEquipmentIsAdrCertified
          ? `Đã chứng nhận${selected.adrEquipmentAllowedClasses ? ` — lớp ${selected.adrEquipmentAllowedClasses}` : ""}`
          : "Không",
      },
      { key: "hazmat", label: "Hazmat", children: selected.isHazmatPlacarded ? "Có gắn biển" : "Không" },
      {
        key: "location",
        label: "Vị trí",
        children: formatLocation(selected.currentLocationLatitude, selected.currentLocationLongitude),
      },
      { key: "version", label: "Phiên bản", children: selected.version },
    ];
  }, [selected]);

  const handleRetry = useCallback(() => {
    void baseQuery.refetch();
    if (searchValue) void searchQuery.refetch();
  }, [baseQuery, searchQuery, searchValue]);

  return (
    <main className={styles.page}>
      <div className={styles.pageContent}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Danh sách xe</h1>
            <p className={styles.subtitle}>Quản lý đội xe</p>
          </div>
          {canCreate ? (
            <TruckCreateModal
              trigger={(show) => (
                <Button type="primary" icon={<PlusOutlined />} onClick={show}>
                  Thêm xe
                </Button>
              )}
            />
          ) : null}
        </header>

        <section className={styles.filters} aria-label="Bộ lọc danh sách xe">
          <div className={styles.searchRow}>
            <Input
              allowClear
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm theo mã xe, biển số, VIN, tài xế, hãng xe…"
              prefix={<SearchOutlined className={styles.searchIcon} />}
              aria-label="Tìm kiếm xe"
            />
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              options={[
                { value: ALL_FILTER_VALUE, label: "Mọi trạng thái" },
                ...VEHICLE_STATUS_OPTIONS,
              ]}
              aria-label="Lọc theo trạng thái"
              className={styles.statusSelect}
            />
          </div>
          <div className={styles.typeChips} role="group" aria-label="Lọc theo loại xe">
            <Tag.CheckableTag
              checked={typeFilter === ALL_FILTER_VALUE}
              onChange={(checked) => {
                if (checked) handleTypeChange(ALL_FILTER_VALUE);
              }}
              className={`${styles.typeChip} ${typeFilter === ALL_FILTER_VALUE ? styles.selectedTypeChip : ""}`}
            >
              Tất cả
            </Tag.CheckableTag>
            {typeChips.map((type) => {
              const checked = typeFilter === type;
              return (
                <Tag.CheckableTag
                  key={type}
                  checked={checked}
                  onChange={(nextChecked) => {
                    if (nextChecked) handleTypeChange(type);
                  }}
                  className={`${styles.typeChip} ${checked ? styles.selectedTypeChip : ""}`}
                >
                  {getVehicleTypeLabel(type)}
                </Tag.CheckableTag>
              );
            })}
          </div>
        </section>

        {hasError ? (
          <Alert
            className={styles.errorAlert}
            message="Không thể tải danh sách xe"
            description="Vui lòng thử lại sau."
            type="error"
            showIcon
            action={<Button size="small" onClick={handleRetry}>Thử lại</Button>}
          />
        ) : null}

        <VehicleList
          vehicles={vehicles}
          canEdit={canEdit}
          canDeactivate={canDeactivate}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={handlePageChange}
          onDetail={handleDetail}
          onEdit={handleEdit}
          onViewRegistration={handleRegistration}
          onAssignDriver={handleAssignDriver}
          onDeactivate={handleDeactivate}
        />
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={handleCloseDrawer}
        width="min(100vw, 460px)"
        title={selected ? `Chi tiết xe — ${selected.licensePlate ?? selected.number}` : null}
        footer={selected ? (
          <div className={styles.drawerFooter}>
            <Button onClick={handleCloseDrawer}>Đóng</Button>
            {canEdit ? (
              <Button type="primary" onClick={() => handleEdit(selected)}>Chỉnh sửa thông tin</Button>
            ) : null}
          </div>
        ) : null}
      >
        {selected ? (
          <div className={styles.drawerContent}>
            <div className={styles.drawerBanner}>
              <img
                src={getVehicleImage(selected.type) || DEFAULT_VEHICLE_IMAGE}
                alt={getVehicleTypeLabel(selected.type)}
                width={104}
                height={76}
                className={styles.drawerImage}
              />
              <VehicleStatus status={selected.status} />
            </div>
            <Descriptions
              column={1}
              size="small"
              bordered
              items={descriptions}
              styles={{ label: { width: 130 } }}
            />
          </div>
        ) : null}
      </Drawer>
    </main>
  );
};
