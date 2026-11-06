/** Hiển thị danh sách bảo trì bằng Refine useTable. */
import { ResourceListPage } from "@/components/ResourceListPage";
import type { MaintenanceRecord } from "@/types/trucks/truck.types";
import { maintenanceColumns } from "@features/maintenance/components/columns";
export const MaintenanceList = () => <ResourceListPage<MaintenanceRecord> columns={maintenanceColumns} resource="maintenance" />;
