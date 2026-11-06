import { Empty, Pagination, Spin } from "antd";

import { PAGE_SIZE } from "@/constants/vehicle";
import type { Vehicle } from "@/types/trucks/vehicle.types";

import { VehicleListItem } from "./VehicleListItem";
import styles from "./vehicleList.module.css";

interface VehicleListProps {
  vehicles: Vehicle[];
  canEdit: boolean;
  canDeactivate: boolean;
  totalItems: number;
  currentPage: number;
  pageSize?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onDetail: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onViewRegistration: (vehicle: Vehicle) => void;
  onAssignDriver: (vehicle: Vehicle) => void;
  onDeactivate: (vehicle: Vehicle) => void;
}

export const VehicleList = ({
  vehicles,
  canEdit,
  canDeactivate,
  totalItems,
  currentPage,
  pageSize = PAGE_SIZE,
  loading = false,
  onPageChange,
  onDetail,
  onEdit,
  onViewRegistration,
  onAssignDriver,
  onDeactivate,
}: VehicleListProps) => (
  <Spin spinning={loading} tip="Đang tải danh sách xe">
    {vehicles.length === 0 ? (
      <div className={styles.emptyState}>
        <Empty description="Không tìm thấy xe nào phù hợp bộ lọc" />
      </div>
    ) : (
      <div className={styles.vehicleList} aria-label="Danh sách xe">
        {vehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
          canEdit={canEdit}
          canDeactivate={canDeactivate}
            onDetail={onDetail}
            onEdit={onEdit}
            onViewRegistration={onViewRegistration}
            onAssignDriver={onAssignDriver}
            onDeactivate={onDeactivate}
          />
        ))}
      </div>
    )}
    {totalItems > pageSize ? (
      <div className={styles.paginationRow}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={onPageChange}
          showSizeChanger={false}
          showTotal={(total, range) => `Hiển thị ${range[0]}–${range[1]} / ${total} xe`}
        />
      </div>
    ) : null}
  </Spin>
);
