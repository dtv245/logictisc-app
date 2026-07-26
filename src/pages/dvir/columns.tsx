/** Định nghĩa columns cho DVIR resource. */
import { createCrudColumns } from "../../components";
import type { DvirReport } from "../../types/dvir";
export const dvirColumns = createCrudColumns<DvirReport>("dvir", [
  { dataIndex: "inspectionDate", title: "Ngày kiểm tra", sorter: true },
  { dataIndex: "type", title: "Loại", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "truckId", title: "Xe tải" },
]);
