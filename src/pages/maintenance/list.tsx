/** Hiển thị danh sách bảo trì bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { MaintenanceRecord } from "../../types/truck";
import { maintenanceColumns } from "./columns";
export const MaintenanceList = () => <ResourceListPage<MaintenanceRecord> columns={maintenanceColumns} resource="maintenance" />;
