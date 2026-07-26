/** Hiển thị danh sách xe tải bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Truck } from "../../types/truck";
import { truckColumns } from "./columns";
export const TruckList = () => <ResourceListPage<Truck> columns={truckColumns} resource="trucks" />;
