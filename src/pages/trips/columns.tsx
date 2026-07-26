/** Định nghĩa columns cho Trip resource. */
import { createCrudColumns } from "../../components";
import type { Trip } from "../../types/trip";
export const tripColumns = createCrudColumns<Trip>("trips", [
  { dataIndex: "number", title: "Số trip", sorter: true },
  { dataIndex: "name", title: "Tên", sorter: true },
  { dataIndex: "status", title: "Trạng thái", sorter: true },
  { dataIndex: "totalDistance", title: "Tổng quãng đường", sorter: true },
]);
