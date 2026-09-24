/** Định nghĩa columns cho Maintenance resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { MaintenanceRecord } from "@/types/truck.types";
export const maintenanceColumns = createCrudColumns<MaintenanceRecord>("maintenance", [
  { dataIndex: "serviceDate", titleKey: "columns.maintenance.serviceDate", sorter: true },
  { dataIndex: "maintenanceType", titleKey: "columns.maintenance.maintenanceType", sorter: true },
  { dataIndex: "truckId", titleKey: "columns.maintenance.truckId" },
  { dataIndex: "odometerReading", titleKey: "columns.maintenance.odometerReading", sorter: true },
]);
