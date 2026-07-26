/** Định nghĩa columns cho Maintenance resource. */
import { createCrudColumns } from "../../components";
import type { MaintenanceRecord } from "../../types/truck";
export const maintenanceColumns = createCrudColumns<MaintenanceRecord>("maintenance", [
  { dataIndex: "serviceDate", title: "Ngày bảo trì", sorter: true },
  { dataIndex: "maintenanceType", title: "Loại bảo trì", sorter: true },
  { dataIndex: "truckId", title: "Xe tải" },
  { dataIndex: "odometerReading", title: "Odometer", sorter: true },
]);
