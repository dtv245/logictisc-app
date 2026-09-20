/** Hiển thị danh sách xe tải bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Truck } from "@/types/truck.types";
import { truckColumns } from "@features/trucks/components/columns";
export const TruckList = () => <ResourceListPage<Truck> columns={truckColumns} resource="trucks" />;
